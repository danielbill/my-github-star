package logger

import (
	"fmt"
	"os"
	"sync"
	"time"
)

var (
	logFile   *os.File
	logMutex  sync.Mutex
	initialized bool
)

// Init 初始化日志系统
func Init() error {
	logMutex.Lock()
	defer logMutex.Unlock()

	if initialized {
		return nil
	}

	var err error
	logFile, err = os.OpenFile("app.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		return err
	}

	initialized = true
	return nil
}

// Close 关闭日志文件
func Close() error {
	logMutex.Lock()
	defer logMutex.Unlock()

	if logFile != nil {
		return logFile.Close()
	}
	return nil
}

// write 写日志
func write(level, format string, v ...interface{}) {
	msg := fmt.Sprintf(format, v...)
	timestamp := time.Now().Format("2006-01-02 15:04:05")
	logMsg := fmt.Sprintf("%s [%s] %s\n", timestamp, level, msg)

	logMutex.Lock()
	defer logMutex.Unlock()

	if logFile != nil {
		logFile.WriteString(logMsg)
	}

	// 同时输出到控制台
	fmt.Print(logMsg)
}

// Info 普通日志
func Info(format string, v ...interface{}) {
	write("INFO", format, v...)
}

// Error 错误日志
func Error(format string, v ...interface{}) {
	write("ERROR", format, v...)
}

// Warn 警告日志
func Warn(format string, v ...interface{}) {
	write("WARN", format, v...)
}

// Debug 调试日志
func Debug(format string, v ...interface{}) {
	write("DEBUG", format, v...)
}

// GetLogs 获取所有日志内容
func GetLogs() string {
	logMutex.Lock()
	defer logMutex.Unlock()

	if logFile == nil {
		return ""
	}

	// 关闭文件以便读取
	logFile.Close()
	defer func() {
		// 重新打开
		logFile, _ = os.OpenFile("app.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	}()

	content, err := os.ReadFile("app.log")
	if err != nil {
		return ""
	}
	return string(content)
}

// ClearLogs 清空日志文件
func ClearLogs() error {
	logMutex.Lock()
	defer logMutex.Unlock()

	if logFile != nil {
		logFile.Close()
	}

	err := os.WriteFile("app.log", []byte(""), 0666)

	// 重新打开
	logFile, _ = os.OpenFile("app.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)

	return err
}
