package auth

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"sync"
)

// CallbackHandler 回调处理函数类型
type CallbackHandler func(code, state string) error

// CallbackServer 本地 HTTP 回调服务器
type CallbackServer struct {
	port     int
	handler  CallbackHandler
	server   *http.Server
	doneChan chan struct{}
	mu       sync.Mutex
}

// NewCallbackServer 创建回调服务器
func NewCallbackServer(port int, handler CallbackHandler) *CallbackServer {
	return &CallbackServer{
		port:     port,
		handler:  handler,
		doneChan: make(chan struct{}),
	}
}

// Start 启动服务器
func (s *CallbackServer) Start() error {
	mux := http.NewServeMux()
	mux.HandleFunc("/callback", s.handleCallback)

	s.server = &http.Server{
		Addr:    fmt.Sprintf(":%d", s.port),
		Handler: mux,
	}

	log.Printf("[OAuth] Callback server listening on :%d", s.port)

	if err := s.server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		return err
	}
	return nil
}

// handleCallback 处理回调请求
func (s *CallbackServer) handleCallback(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	code := query.Get("code")
	state := query.Get("state")
	errorParam := query.Get("error")

	// 延迟停止服务器
	go func() {
		s.mu.Lock()
		defer s.mu.Unlock()
		if s.server != nil {
			s.server.Shutdown(context.Background())
		}
		close(s.doneChan)
	}()

	if errorParam != "" {
		errorDesc := query.Get("error_description")
		if errorDesc == "" {
			errorDesc = "授权被拒绝或已取消"
		}
		html := errorPage(errorParam, errorDesc)
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(html))
		log.Printf("[OAuth] Error: %s - %s", errorParam, errorDesc)
		return
	}

	if code == "" || state == "" {
		html := errorPage("invalid_request", "缺少 code 或 state 参数")
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(html))
		return
	}

	// 调用处理器
	if err := s.handler(code, state); err != nil {
		html := errorPage("exchange_failed", err.Error())
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(html))
		log.Printf("[OAuth] Token exchange failed: %v", err)
		return
	}

	// 成功页面
	html := successPage()
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Write([]byte(html))
	log.Printf("[OAuth] Login successful")
}

// Stop 停止服务器
func (s *CallbackServer) Stop() {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.server != nil {
		s.server.Shutdown(context.Background())
	}
}

// Done 返回完成通道
func (s *CallbackServer) Done() <-chan struct{} {
	return s.doneChan
}

// successPage 成功页面 HTML
func successPage() string {
	return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>登录成功</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: #212830;
            color: #a0a0a0;
        }
        .container {
            text-align: center;
            padding: 40px;
            background: #2d333b;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
            max-width: 400px;
        }
        .icon {
            width: 64px;
            height: 64px;
            margin: 0 auto 20px;
            background: #238636;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .icon svg {
            width: 32px;
            height: 32px;
            fill: white;
        }
        h1 {
            color: #56d364;
            font-size: 24px;
            margin-bottom: 12px;
        }
        p {
            font-size: 16px;
            line-height: 1.5;
            color: #8b949e;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">
            <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/>
            </svg>
        </div>
        <h1>登录成功</h1>
        <p>您可以关闭此页面并返回应用。</p>
    </div>
</body>
</html>`
}

// errorPage 错误页面 HTML
func errorPage(errorCode, errorDesc string) string {
	return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>登录失败</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: #212830;
            color: #a0a0a0;
        }
        .container {
            text-align: center;
            padding: 40px;
            background: #2d333b;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
            max-width: 400px;
        }
        .icon {
            width: 64px;
            height: 64px;
            margin: 0 auto 20px;
            background: #da3633;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .icon svg {
            width: 32px;
            height: 32px;
            fill: white;
        }
        h1 {
            color: #f85149;
            font-size: 24px;
            margin-bottom: 12px;
        }
        p {
            font-size: 14px;
            line-height: 1.5;
            color: #8b949e;
            margin-bottom: 8px;
        }
        .error-code {
            font-size: 12px;
            color: #6e7681;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">
            <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.47.22A.75.75 0 015 0h6a.75.75 0 01.53.22l4.25 4.25c.141.14.22.332.22.53v6a.75.75 0 01-.22.53l-4.25 4.25A.75.75 0 0111 16H5a.75.75 0 01-.53-.22L.22 11.53A.75.75 0 010 11V5a.75.75 0 01.22-.53L4.47.22zm.84 1.28L1.5 5.31v5.38l3.81 3.81h5.38l3.81-3.81V5.31L10.69 1.5H5.31zM8 4a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 4zm0 8a1 1 0 100-2 1 1 0 000 2z"/>
            </svg>
        </div>
        <h1>登录失败</h1>
        <p>` + errorDesc + `</p>
        <p class="error-code">错误代码: ` + errorCode + `</p>
    </div>
</body>
</html>`
}
