package main

import (
	"FastDB-Web/global"
	"FastDB-Web/internal/api"
	"FastDB-Web/internal/config"
	"FastDB-Web/internal/logger"
	"FastDB-Web/internal/storage"
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"runtime"
	"syscall"
	"time"

	"go.uber.org/zap"
)

// 添加全局错误处理函数
func handlePanic() {
	if r := recover(); r != nil {
		// 获取堆栈跟踪
		stack := make([]byte, 4096)
		length := runtime.Stack(stack, false)

		logger.Error("程序发生严重错误",
			zap.Any("error", r),
			zap.ByteString("stack", stack[:length]),
		)

		// 给程序一点时间来记录日志
		time.Sleep(100 * time.Millisecond)
		os.Exit(1)
	}
}

func main() {
	// 添加全局panic处理
	defer handlePanic()

	// 加载配置
	cfg, err := config.Load()
	global.G_Config = cfg
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// 初始化日志系统
	logger.InitLogger(cfg.Log.Path, cfg.Log.Level, cfg.Log.IsDevelopment)
	defer logger.Sync()

	logger.Info("服务启动",
		zap.String("host", cfg.Server.Host),
		zap.String("port", cfg.Server.Port),
		zap.String("name", "FastDB-Web"),
		zap.String("description", "一个基于Go语言的键值存储系统"),
		zap.String("version", "1.0.0"),
		zap.String("build_time", "2023-10-15"),
		zap.String("go_version", runtime.Version()),
		zap.String("env", func() string {
			if cfg.Log.IsDevelopment {
				return "development"
			}
			return "production"
		}()),
	)

	// 初始化存储
	logger.Info("初始化存储", zap.String("type", cfg.Storage.Type))
	store, err := storage.NewKVStore(cfg.Storage)
	if err != nil {
		logger.Fatal("初始化存储失败", zap.Error(err))
	}
	defer store.Close()

	// 初始化API处理器
	handler := api.NewHandler(store)
	router := handler.SetupRouter()

	// 创建HTTP服务器
	addr := cfg.Server.Host + ":" + cfg.Server.Port
	srv := &http.Server{
		Addr:    addr,
		Handler: router,
	}

	// 在goroutine中启动服务器
	go func() {
		logger.Info("启动HTTP服务器", zap.String("addr", addr))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal("HTTP服务器启动失败", zap.Error(err))
		}
	}()

	// 等待中断信号以优雅地关闭服务器
	quit := make(chan os.Signal, 1)
	// kill (无参数) 默认发送 syscall.SIGTERM
	// kill -2 发送 syscall.SIGINT
	// kill -9 发送 syscall.SIGKILL，但无法被捕获，所以不需要添加
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	logger.Info("接收到关闭信号，开始关闭服务器")

	// 设置5秒的超时时间来关闭服务器
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		logger.Fatal("服务器强制关闭", zap.Error(err))
	}

	// 确保数据库连接关闭
	logger.Info("同步并关闭数据库连接")
	store.Sync()
	store.Close()

	logger.Info("服务器已安全关闭")
}
