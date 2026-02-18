package database

import (
	"fmt"
	"os"
	"path/filepath"
	"time"

	// 使用纯 Go SQLite 驱动，必须在 gorm 驱动之前导入
	_ "modernc.org/sqlite"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// DB 数据库封装
type DB struct {
	db *gorm.DB
}

// NewDB 创建数据库实例
func NewDB(sharedDir string) (*DB, error) {
	dbPath := filepath.Join(sharedDir, "trending.db")

	// 确保目录存在
	if err := os.MkdirAll(filepath.Dir(dbPath), 0755); err != nil {
		return nil, fmt.Errorf("创建数据库目录失败: %w", err)
	}

	// 打开数据库连接，使用纯 Go SQLite 驱动
	db, err := gorm.Open(sqlite.Dialector{
		DriverName: "sqlite",
		DSN:        dbPath,
	}, &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		return nil, fmt.Errorf("打开数据库失败: %w", err)
	}

	// 获取底层数据库连接并配置
	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("获取数据库连接失败: %w", err)
	}

	// 设置连接池
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	return &DB{db: db}, nil
}

// Init 初始化数据库表结构
func (d *DB) Init() error {
	return d.db.AutoMigrate(&TrendingEntry{}, &UserStarRepo{})
}

// Close 关闭数据库连接
func (d *DB) Close() error {
	sqlDB, err := d.db.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}

// GetDB 获取原始 GORM DB 实例
func (d *DB) GetDB() *gorm.DB {
	return d.db
}

// HasData 检查数据库是否有数据
func (d *DB) HasData() (bool, error) {
	var count int64
	err := d.db.Model(&TrendingEntry{}).Count(&count).Error
	return count > 0, err
}
