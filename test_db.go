package main

import (
	"fmt"
	"os"
	"path/filepath"

	"github-star-app/backend/database"
)

func main() {
	// 创建临时目录
	tmpDir, err := os.MkdirTemp("", "test-db-*")
	if err != nil {
		fmt.Printf("创建临时目录失败: %v\n", err)
		os.Exit(1)
	}
	defer os.RemoveAll(tmpDir)

	// 初始化数据库
	db, err := database.NewDB(tmpDir)
	if err != nil {
		fmt.Printf("初始化数据库失败: %v\n", err)
		os.Exit(1)
	}

	// 初始化表结构
	if err := db.Init(); err != nil {
		fmt.Printf("初始化表结构失败: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("数据库初始化成功!")

	// 检查是否有数据
	hasData, err := db.HasData()
	if err != nil {
		fmt.Printf("检查数据失败: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("数据库有数据: %v\n", hasData)

	// 检查数据库文件是否存在
	dbPath := filepath.Join(tmpDir, "trending.db")
	if _, err := os.Stat(dbPath); os.IsNotExist(err) {
		fmt.Printf("数据库文件不存在: %s\n", dbPath)
	} else {
		fmt.Printf("数据库文件已创建: %s\n", dbPath)
	}

	db.Close()
	fmt.Println("测试通过!")
}
