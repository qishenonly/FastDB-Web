package api

import (
	"FastDB-Web/global"
	"FastDB-Web/internal/logger"
	"FastDB-Web/internal/storage"
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// Handler 处理HTTP请求
type Handler struct {
	store  storage.KVStore
	status FastDBStatus
}

type FastDBStatus int

const (
	StatusRunning FastDBStatus = iota
	StatusStopped
)

// NewHandler 创建一个新的Handler
func NewHandler(store storage.KVStore) *Handler {
	return &Handler{store: store, status: StatusStopped}
}

// SetupRouter 配置路由
func (h *Handler) SetupRouter() *gin.Engine {
	// 创建默认的gin路由器
	r := gin.New() // 不使用默认的Logger和Recovery

	// 添加自定义中间件
	r.Use(LoggerMiddleware())
	r.Use(RecoveryMiddleware())
	r.Use(CORSMiddleware())

	// 健康检查
	r.GET("/health", h.healthCheck)

	// API路由组
	api := r.Group("/api/v1")
	{
		// 键值操作
		api.GET("/kv/:key", h.getKey)
		api.PUT("/kv/:key", h.setKey)
		api.DELETE("/kv/:key", h.deleteKey)

		// 列出键值对
		api.GET("/kvs", h.listKeys)

		// 数据库连接
		api.POST("/db/connect", h.connectDB)
		api.GET("/db/status", h.dbStatus)
		api.POST("/db/close", h.closeDB)
	}

	return r
}

// healthCheck 处理健康检查请求
func (h *Handler) healthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "ok",
	})
}

// getKey 处理获取键值的请求
func (h *Handler) getKey(c *gin.Context) {
	h.checkFastDBStatus(c)
	if h.status != StatusRunning {
		return
	}

	key := c.Param("key")
	if key == "" {
		logger.ErrorWithLocation("请求缺少key参数", nil,
			zap.String("path", c.Request.URL.Path),
			zap.String("handler", "getKey"),
		)
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Status:  "error",
			Message: "Key is required",
			Code:    http.StatusBadRequest,
		})
		return
	}

	requestID, _ := c.Get("requestID")

	logger.Debug("尝试获取键值",
		zap.String("key", key),
		zap.String("requestID", requestID.(string)),
		zap.String("handler", "getKey"),
	)

	value, err := h.store.Get([]byte(key))
	if err != nil {
		logger.ErrorWithLocation("获取键值失败", err,
			zap.String("key", key),
			zap.String("requestID", requestID.(string)),
			zap.String("handler", "getKey"),
		)
		if err.Error() == "leveldb: not found" {
			c.JSON(http.StatusNotFound, ErrorResponse{
				Status:  "error",
				Message: "Key not found",
				Code:    http.StatusNotFound,
			})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Status:  "error",
			Message: "Internal server error",
			Code:    http.StatusInternalServerError,
		})
		return
	}

	logger.Info("成功获取键值",
		zap.String("key", key),
		zap.Int("valueSize", len(value)),
		zap.String("requestID", requestID.(string)),
		zap.String("handler", "getKey"),
	)
	c.JSON(http.StatusOK, KeyValueResponse{
		Key:   key,
		Value: string(value),
	})
}

// setKey 处理设置键值的请求
func (h *Handler) setKey(c *gin.Context) {
	h.checkFastDBStatus(c)
	if h.status != StatusRunning {
		return
	}

	key := c.Param("key")
	if key == "" {
		logger.Warn("请求缺少key参数", zap.String("path", c.Request.URL.Path))
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Status:  "error",
			Message: "Key is required",
			Code:    http.StatusBadRequest,
		})
		return
	}

	var req KeyValueRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error("解析请求体失败",
			zap.String("key", key),
			zap.Error(err))
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Status:  "error",
			Message: "Invalid request: " + err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	logger.Debug("设置键值", zap.String("key", key), zap.String("value", req.Value))
	if err := h.store.Put([]byte(key), []byte(req.Value)); err != nil {
		logger.Error("设置键值失败",
			zap.String("key", key),
			zap.Error(err))
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Status:  "error",
			Message: "Failed to store value: " + err.Error(),
			Code:    http.StatusInternalServerError,
		})
		return
	}

	logger.Info("成功设置键值", zap.String("key", key))
	c.JSON(http.StatusOK, Response{
		Status:  "success",
		Message: "Value stored successfully",
		Data: KeyValueResponse{
			Key:   key,
			Value: req.Value,
		},
	})
}

// deleteKey 处理删除键值的请求
func (h *Handler) deleteKey(c *gin.Context) {
	h.checkFastDBStatus(c)
	if h.status != StatusRunning {
		return
	}

	key := c.Param("key")
	if key == "" {
		logger.Warn("请求缺少key参数", zap.String("path", c.Request.URL.Path))
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Status:  "error",
			Message: "Key is required",
			Code:    http.StatusBadRequest,
		})
		return
	}

	// 先检查键是否存在
	_, err := h.store.Get([]byte(key))
	if err != nil {
		logger.Error("删除键值失败",
			zap.String("key", key),
			zap.Error(err))
		if err.Error() == "leveldb: not found" {
			c.JSON(http.StatusNotFound, ErrorResponse{
				Status:  "error",
				Message: "Key not found",
				Code:    http.StatusNotFound,
			})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Status:  "error",
			Message: "Internal server error",
			Code:    http.StatusInternalServerError,
		})
		return
	}

	if err := h.store.Delete([]byte(key)); err != nil {
		logger.Error("删除键值失败",
			zap.String("key", key),
			zap.Error(err))
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Status:  "error",
			Message: "Failed to delete key: " + err.Error(),
			Code:    http.StatusInternalServerError,
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Status:  "success",
		Message: "Key deleted successfully",
		Data: gin.H{
			"key": key,
		},
	})
}

// listKeys 处理列出键值对的请求
func (h *Handler) listKeys(c *gin.Context) {
	h.checkFastDBStatus(c)
	if h.status != StatusRunning {
		return
	}

	// 列出键值对
	items := h.store.GetListKeys()
	result := make([]string, 0)
	resultItems := make(map[string]string, len(items))

	logger.Info("列出键值对", zap.Int("totalKeys", len(result)))
	for _, v := range items {
		result = append(result, string(v))
	}
	if len(result) == 0 {
		c.JSON(http.StatusOK, ListResponse{
			Total: 0,
			Items: resultItems,
		})
		return
	}

	for _, v := range result {
		value, err := h.store.Get([]byte(v))
		if err != nil {
			logger.Error("获取键值失败",
				zap.String("key", v),
				zap.Error(err))
			c.JSON(http.StatusInternalServerError, ErrorResponse{
				Status:  "error",
				Message: "Failed to get value: " + err.Error(),
				Code:    http.StatusInternalServerError,
			})
			return
		}
		resultItems[v] = string(value)
	}

	c.JSON(http.StatusOK, ListResponse{
		Total: len(result),
		Items: resultItems,
	})
}

// connectDB 处理数据库连接请求
func (h *Handler) connectDB(c *gin.Context) {
	// 检查数据库连接状态
	var req ConnectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error("解析请求体失败", zap.Error(err))
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Status:  "error",
			Message: "Invalid request: " + err.Error(),
			Code:    http.StatusBadRequest,
		})
	}

	// 检查数据库连接状态
	if h.status == StatusRunning {
		c.JSON(http.StatusOK, ConnectResponse{
			Status:  "success",
			Message: "Database is already connected",
		})
		return
	}

	// 连接数据库
	if req.Host != global.G_FastDB_Host {
		logger.Error("Invalid host", zap.String("host", req.Host))
		h.status = StatusStopped
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Status:  "error",
			Message: "Invalid host",
			Code:    http.StatusBadRequest,
		})
		return
	}

	if req.Port != global.G_FastDB_Port {
		logger.Error("Invalid port", zap.String("port", req.Port))
		h.status = StatusStopped
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Status:  "error",
			Message: "Invalid port",
			Code:    http.StatusBadRequest,
		})
		return
	}

	if req.Username != global.G_FastDB_UserName {
		logger.Error("Invalid username", zap.String("username", req.Username))
		h.status = StatusStopped
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Status:  "error",
			Message: "Invalid username",
			Code:    http.StatusBadRequest,
		})
		return
	}

	if req.Password != global.G_FastDB_Password {
		logger.Error("Invalid password", zap.String("password", req.Password))
		h.status = StatusStopped
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Status:  "error",
			Message: "Invalid password",
			Code:    http.StatusBadRequest,
		})
		return
	}

	// 连接数据库
	logger.Info("连接数据库",
		zap.String("host", req.Host),
		zap.String("port", req.Port),
		zap.String("username", req.Username),
		zap.String("password", req.Password),
	)
	h.status = StatusRunning
	c.JSON(http.StatusOK, ConnectResponse{
		Status:  "success",
		Message: "Database connected successfully",
	})

}

func (h *Handler) checkFastDBStatus(c *gin.Context) {
	if h.status == StatusStopped {
		logger.Warn("FastDB已停止")
		c.JSON(http.StatusServiceUnavailable, ErrorResponse{
			Status:  "error",
			Message: "FastDB is not connected",
			Code:    http.StatusServiceUnavailable,
		})
		return
	}
}

// dbStatus 处理数据库连接状态请求
func (h *Handler) dbStatus(c *gin.Context) {
	if h.status == StatusRunning {
		logger.Info("数据库连接成功")
	} else {
		logger.Error("数据库连接失败")
	}

	if h.status == StatusStopped {
		c.JSON(http.StatusServiceUnavailable, ErrorResponse{
			Status:  "error",
			Message: "FastDB is not connected",
			Code:    http.StatusServiceUnavailable,
		})
		return
	}
	c.JSON(http.StatusOK, DBStatusResponse{
		Status:  "success",
		Message: "Database is connected",
		details: Detail{
			Host:     global.G_Config.Server.Host,
			Port:     global.G_FastDB_Port,
			Username: "admin",
		},
	})
}

// closeDB 处理关闭数据库连接请求
func (h *Handler) closeDB(c *gin.Context) {
	// 检查数据库连接状态
	if h.status == StatusStopped {
		c.JSON(http.StatusOK, DBStatusResponse{
			Status:  "success",
			Message: "Database is already closed",
		})
		return
	}

	// 关闭数据库连接
	h.status = StatusStopped
	logger.Info("关闭数据库")
	c.JSON(http.StatusOK, DBStatusResponse{
		Status:  "success",
		Message: "Database closed successfully",
	})
}
