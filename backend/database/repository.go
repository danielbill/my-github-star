package database

import (
	"fmt"
	"time"

	"gorm.io/gorm"
)

// SaveTrendingEntries 保存趋势数据
// 先删除同一时间范围的旧数据，再保存新数据
func (d *DB) SaveTrendingEntries(entries []TrendingEntry, timeRange string, cachedAt time.Time) error {
	// 使用事务
	return d.db.Transaction(func(tx *gorm.DB) error {
		// 删除同一时间范围的旧数据（保持数据库清洁）
		if err := tx.Where("time_range = ?", timeRange).Delete(&TrendingEntry{}).Error; err != nil {
			return fmt.Errorf("删除旧数据失败: %w", err)
		}

		// 设置缓存时间和时间范围
		for i := range entries {
			entries[i].CachedAt = cachedAt
			entries[i].TimeRange = timeRange
		}

		// 批量插入新数据
		if len(entries) > 0 {
			if err := tx.Create(&entries).Error; err != nil {
				return fmt.Errorf("保存数据失败: %w", err)
			}
		}

		return nil
	})
}

// GetLatestEntries 获取指定时间范围的最新数据
func (d *DB) GetLatestEntries(timeRange string) ([]TrendingEntry, error) {
	var entries []TrendingEntry

	// 获取该时间范围最新的缓存时间
	var latestEntry TrendingEntry
	if err := d.db.Where("time_range = ?", timeRange).
		Order("cached_at DESC").
		First(&latestEntry).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return []TrendingEntry{}, nil
		}
		return nil, err
	}

	// 获取该时间的所有条目
	if err := d.db.Where("time_range = ? AND cached_at = ?", timeRange, latestEntry.CachedAt).
		Order("stars_since DESC").
		Find(&entries).Error; err != nil {
		return nil, err
	}

	return entries, nil
}

// GetCachedTime 获取指定时间范围的缓存时间
func (d *DB) GetCachedTime(timeRange string) (time.Time, error) {
	var entry TrendingEntry
	err := d.db.Where("time_range = ?", timeRange).
		Order("cached_at DESC").
		First(&entry).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return time.Time{}, nil // 没有数据，返回零值
		}
		return time.Time{}, err
	}

	return entry.CachedAt, nil
}

// ShouldRefresh 检查是否需要刷新数据
// 返回 (是否需要刷新, 当前缓存时间, 错误)
func (d *DB) ShouldRefresh(timeRange string) (bool, time.Time, error) {
	cachedAt, err := d.GetCachedTime(timeRange)
	if err != nil {
		return true, time.Time{}, err
	}

	// 如果没有缓存数据，需要刷新
	if cachedAt.IsZero() {
		return true, time.Time{}, nil
	}

	// 检查缓存时间是否在当前小时内
	now := time.Now()
	cachedHour := cachedAt.Truncate(time.Hour)
	currentHour := now.Truncate(time.Hour)

	// 同一小时内的缓存，不需要刷新
	if cachedHour.Equal(currentHour) {
		return false, cachedAt, nil
	}

	// 不同小时，需要刷新
	return true, cachedAt, nil
}

// FormatCachedTime 格式化缓存时间为字符串
// 格式: 2006-01-02 15:00:00
func FormatCachedTime(t time.Time) string {
	if t.IsZero() {
		return ""
	}
	return t.Format("2006-01-02 15:00:00")
}

// ParseCachedTime 从字符串解析缓存时间
func ParseCachedTime(s string) (time.Time, error) {
	if s == "" {
		return time.Time{}, nil
	}
	return time.Parse("2006-01-02 15:00:00", s)
}
