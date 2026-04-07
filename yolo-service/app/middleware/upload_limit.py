"""
YOLO Service - 文件上传限制中间件

提供文件上传大小限制、类型验证等功能。
"""

import os
from typing import List, Optional
from fastapi import UploadFile, HTTPException, Request


# 默认配置
DEFAULT_MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB
DEFAULT_MAX_VIDEO_SIZE = 100 * 1024 * 1024  # 100MB
DEFAULT_MAX_BATCH_SIZE = 20  # 最大批处理数量

# 允许的文件类型
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp", "image/jpg"}


class UploadConfig:
    """上传配置"""
    max_image_size: int
    max_video_size: int
    max_batch_size: int
    allowed_image_types: set

    def __init__(self):
        self.max_image_size = int(os.getenv("MAX_IMAGE_SIZE", DEFAULT_MAX_IMAGE_SIZE))
        self.max_video_size = int(os.getenv("MAX_VIDEO_SIZE", DEFAULT_MAX_VIDEO_SIZE))
        self.max_batch_size = int(os.getenv("MAX_BATCH_SIZE", DEFAULT_MAX_BATCH_SIZE))
        self.allowed_image_types = ALLOWED_IMAGE_TYPES

    @property
    def max_image_size_mb(self) -> float:
        return self.max_image_size / (1024 * 1024)

    @property
    def max_video_size_mb(self) -> float:
        return self.max_video_size / (1024 * 1024)


# 全局配置实例
upload_config = UploadConfig()


def format_file_size(size_bytes: int) -> str:
    """格式化文件大小"""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.2f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.2f} MB"


async def validate_file_size(
    file: UploadFile,
    max_size: int,
    file_type: str = "文件"
) -> None:
    """
    验证文件大小

    Args:
        file: 上传的文件
        max_size: 最大大小（字节）
        file_type: 文件类型描述

    Raises:
        HTTPException: 文件超过大小限制
    """
    content = await file.read()
    size = len(content)
    await file.seek(0)

    if size > max_size:
        max_size_str = format_file_size(max_size)
        actual_size_str = format_file_size(size)
        raise HTTPException(
            status_code=413,
            detail={
                "code": 6001,
                "category": "validation",
                "message": f"{file_type}大小超过限制",
                "detail": f"实际大小: {actual_size_str}, 最大限制: {max_size_str}",
            }
        )


async def validate_file_type(
    file: UploadFile,
    allowed_types: set,
    file_type: str = "文件"
) -> None:
    """
    验证文件类型

    Args:
        file: 上传的文件
        allowed_types: 允许的MIME类型集合
        file_type: 文件类型描述

    Raises:
        HTTPException: 文件类型不支持
    """
    if file.content_type not in allowed_types:
        allowed_list = ", ".join(sorted(allowed_types))
        raise HTTPException(
            status_code=415,
            detail={
                "code": 6002,
                "category": "validation",
                "message": f"{file_type}类型不支持",
                "detail": f"实际类型: {file.content_type}, 允许的类型: {allowed_list}",
            }
        )


async def validate_image_upload(file: UploadFile) -> bytes:
    """
    验证并读取图片上传

    Args:
        file: 上传的图片文件

    Returns:
        文件内容字节

    Raises:
        HTTPException: 验证失败
    """
    await validate_file_size(file, upload_config.max_image_size, "图片")
    await validate_file_type(file, upload_config.allowed_image_types, "图片")

    content = await file.read()
    await file.seek(0)

    return content


def validate_batch_size(files: List[UploadFile]) -> None:
    """
    验证批处理数量

    Args:
        files: 文件列表

    Raises:
        HTTPException: 数量超过限制
    """
    if len(files) > upload_config.max_batch_size:
        raise HTTPException(
            status_code=400,
            detail={
                "code": 400,
                "category": "validation",
                "message": f"批量上传数量超过限制",
                "detail": f"实际数量: {len(files)}, 最大限制: {upload_config.max_batch_size}",
            }
        )


def get_upload_config_info() -> dict:
    """获取上传配置信息"""
    return {
        "max_image_size": format_file_size(upload_config.max_image_size),
        "max_video_size": format_file_size(upload_config.max_video_size),
        "max_batch_size": upload_config.max_batch_size,
        "allowed_image_types": sorted(list(upload_config.allowed_image_types)),
    }
