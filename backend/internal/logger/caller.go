package logger

import (
	"runtime"
	"strings"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

// CallerInfo 获取调用者信息
func CallerInfo(skip int) (file string, line int, function string) {
	pc, file, line, ok := runtime.Caller(skip + 1)
	if !ok {
		return "unknown", 0, "unknown"
	}

	// 获取短文件名
	parts := strings.Split(file, "/")
	if len(parts) > 2 {
		file = strings.Join(parts[len(parts)-2:], "/")
	}

	// 获取函数名
	funcName := runtime.FuncForPC(pc).Name()
	parts = strings.Split(funcName, ".")
	function = parts[len(parts)-1]

	return file, line, function
}

// WithCaller 添加调用者信息到日志字段
func WithCaller(skip int) []zapcore.Field {
	file, line, function := CallerInfo(skip + 1)
	return []zapcore.Field{
		zap.String("file", file),
		zap.Int("line", line),
		zap.String("function", function),
	}
}

// 使用示例:
// logger.Error("发生错误", append(WithCaller(0), zap.Error(err))...)
