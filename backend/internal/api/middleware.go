package api

import (
	"FastDB-Web/internal/logger"
	"bytes"
	"io"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

// LoggerMiddleware 记录请求日志的中间件
func LoggerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 开始时间
		startTime := time.Now()

		// 获取或生成请求ID
		requestID, exists := c.Get("requestID")
		if !exists {
			requestID = uuid.New().String()
			c.Set("requestID", requestID)
		}

		// 读取请求体
		var requestBody []byte
		if c.Request.Body != nil {
			requestBody, _ = io.ReadAll(c.Request.Body)
			// 重置请求体，以便后续处理器可以读取
			c.Request.Body = io.NopCloser(bytes.NewBuffer(requestBody))
		}

		// 处理请求
		c.Next()

		// 结束时间
		endTime := time.Now()

		// 请求处理时间
		latency := endTime.Sub(startTime)

		// 获取客户端IP
		clientIP := c.ClientIP()

		// 获取HTTP方法
		method := c.Request.Method

		// 获取请求路径
		path := c.Request.URL.Path

		// 获取查询参数
		query := c.Request.URL.RawQuery

		// 获取状态码
		statusCode := c.Writer.Status()

		// 获取错误信息
		errorMessage := c.Errors.ByType(gin.ErrorTypePrivate).String()

		// 记录日志
		if errorMessage != "" {
			// 有错误的请求
			logger.Error("HTTP请求处理出错",
				zap.String("requestID", requestID.(string)),
				zap.String("clientIP", clientIP),
				zap.String("method", method),
				zap.String("path", path),
				zap.String("query", query),
				zap.String("body", string(requestBody)),
				zap.String("error", errorMessage),
				zap.Duration("latency", latency),
				zap.Int("statusCode", statusCode),
			)
		} else if statusCode >= 400 {
			// HTTP错误
			logger.Warn("HTTP请求返回错误状态码",
				zap.String("requestID", requestID.(string)),
				zap.String("clientIP", clientIP),
				zap.String("method", method),
				zap.String("path", path),
				zap.String("query", query),
				zap.Duration("latency", latency),
				zap.Int("statusCode", statusCode),
			)
		} else {
			// 正常的请求
			logger.Info("HTTP请求处理成功",
				zap.String("requestID", requestID.(string)),
				zap.String("clientIP", clientIP),
				zap.String("method", method),
				zap.String("path", path),
				zap.String("query", query),
				zap.Duration("latency", latency),
				zap.Int("statusCode", statusCode),
			)
		}
	}
}

// CORSMiddleware 处理跨域请求的中间件
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

// RecoveryMiddleware 从panic中恢复的中间件
func RecoveryMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				logger.Error("服务器内部错误",
					zap.Any("error", err),
					zap.String("path", c.Request.URL.Path),
					zap.String("method", c.Request.Method),
					zap.String("clientIP", c.ClientIP()),
				)
				c.AbortWithStatus(500)
			}
		}()
		c.Next()
	}
}

// RequestIDMiddleware 为每个请求添加唯一ID
func RequestIDMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 生成请求ID
		requestID := uuid.New().String()

		// 将请求ID添加到上下文
		c.Set("requestID", requestID)

		// 添加到响应头
		c.Writer.Header().Set("X-Request-ID", requestID)

		// 继续处理请求
		c.Next()
	}
}
