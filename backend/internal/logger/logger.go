package logger

import (
	"context"
	"os"
	"path/filepath"
	"runtime"
	"time"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var (
	// Log 全局日志实例
	Log *zap.Logger
)

// InitLogger 初始化日志系统
func InitLogger(logPath string, level string, isDevelopment bool) {
	// 确保日志目录存在
	if err := os.MkdirAll(logPath, 0755); err != nil {
		panic("创建日志目录失败: " + err.Error())
	}

	// 设置日志级别
	var logLevel zapcore.Level
	switch level {
	case "debug":
		logLevel = zapcore.DebugLevel
	case "info":
		logLevel = zapcore.InfoLevel
	case "warn":
		logLevel = zapcore.WarnLevel
	case "error":
		logLevel = zapcore.ErrorLevel
	default:
		logLevel = zapcore.InfoLevel
	}

	// 配置编码器
	encoderConfig := zapcore.EncoderConfig{
		TimeKey:        "time",
		LevelKey:       "level",
		NameKey:        "logger",
		CallerKey:      "caller",
		FunctionKey:    "function",
		MessageKey:     "msg",
		StacktraceKey:  "stacktrace",
		LineEnding:     zapcore.DefaultLineEnding,
		EncodeLevel:    zapcore.CapitalLevelEncoder,
		EncodeTime:     zapcore.ISO8601TimeEncoder,
		EncodeDuration: zapcore.SecondsDurationEncoder,
		EncodeCaller:   zapcore.FullCallerEncoder,
	}

	// 创建核心
	var core zapcore.Core

	if isDevelopment {
		// 开发环境: 输出到控制台和文件
		consoleEncoder := zapcore.NewConsoleEncoder(encoderConfig)
		consoleOutput := zapcore.AddSync(os.Stdout)

		// 文件输出
		now := time.Now().Format("2006-01-02")
		logFile, err := os.OpenFile(
			filepath.Join(logPath, now+".log"),
			os.O_CREATE|os.O_APPEND|os.O_WRONLY,
			0644,
		)
		if err != nil {
			panic("打开日志文件失败: " + err.Error())
		}
		fileOutput := zapcore.AddSync(logFile)

		core = zapcore.NewTee(
			zapcore.NewCore(consoleEncoder, consoleOutput, logLevel),
			zapcore.NewCore(zapcore.NewJSONEncoder(encoderConfig), fileOutput, logLevel),
		)
	} else {
		// 生产环境: 只输出到文件
		now := time.Now().Format("2006-01-02")
		logFile, err := os.OpenFile(
			filepath.Join(logPath, now+".log"),
			os.O_CREATE|os.O_APPEND|os.O_WRONLY,
			0644,
		)
		if err != nil {
			panic("打开日志文件失败: " + err.Error())
		}
		fileOutput := zapcore.AddSync(logFile)

		core = zapcore.NewCore(
			zapcore.NewJSONEncoder(encoderConfig),
			fileOutput,
			logLevel,
		)
	}

	// 创建日志实例
	Log = zap.New(
		core,
		zap.AddCaller(),
		zap.AddCallerSkip(1),
		zap.AddStacktrace(zapcore.ErrorLevel),
	)
	Log.Info("日志系统初始化完成", zap.String("level", level), zap.String("path", logPath))
}

// Debug 输出调试级别日志
func Debug(msg string, fields ...zapcore.Field) {
	Log.Debug(msg, fields...)
}

// Info 输出信息级别日志
func Info(msg string, fields ...zapcore.Field) {
	Log.Info(msg, fields...)
}

// Warn 输出警告级别日志
func Warn(msg string, fields ...zapcore.Field) {
	Log.Warn(msg, fields...)
}

// Error 输出错误级别日志
func Error(msg string, fields ...zapcore.Field) {
	Log.Error(msg, fields...)
}

// Fatal 输出致命错误日志并退出程序
func Fatal(msg string, fields ...zapcore.Field) {
	Log.Fatal(msg, fields...)
}

// Sync 同步日志缓冲区到磁盘
func Sync() {
	Log.Sync()
}

// 添加新的日志函数，自动记录调用位置
func DebugWithContext(ctx context.Context, msg string, fields ...zapcore.Field) {
	// 添加请求ID等上下文信息
	if reqID := ctx.Value("requestID"); reqID != nil {
		fields = append(fields, zap.String("requestID", reqID.(string)))
	}
	Log.Debug(msg, fields...)
}

func InfoWithContext(ctx context.Context, msg string, fields ...zapcore.Field) {
	if reqID := ctx.Value("requestID"); reqID != nil {
		fields = append(fields, zap.String("requestID", reqID.(string)))
	}
	Log.Info(msg, fields...)
}

func ErrorWithContext(ctx context.Context, msg string, fields ...zapcore.Field) {
	if reqID := ctx.Value("requestID"); reqID != nil {
		fields = append(fields, zap.String("requestID", reqID.(string)))
	}
	Log.Error(msg, fields...)
}

// 添加一个函数用于记录错误和代码位置
func ErrorWithLocation(msg string, err error, fields ...zapcore.Field) {
	if err != nil {
		fields = append(fields, zap.Error(err))
	}

	// 获取调用者信息
	pc, file, line, ok := runtime.Caller(1)
	if ok {
		funcName := runtime.FuncForPC(pc).Name()
		fields = append(fields,
			zap.String("file", file),
			zap.Int("line", line),
			zap.String("function", funcName),
		)
	}

	Log.Error(msg, fields...)
}
