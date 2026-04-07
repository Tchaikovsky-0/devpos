#!/usr/bin/env python3
"""
巡检宝 Logo 与 UI 设计生成器
"""

from PIL import Image, ImageDraw, ImageFont
import math
import os

# 创建输出目录
OUTPUT_DIR = "/Users/fanxing/xunjianbao/design-system/output"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def create_xunjianbao_logo(size=1024, bg_color=(255, 255, 255), line_color=(0, 0, 0)):
    """
    创建巡检宝Logo - 中心对称白底黑线风格
    融合"监控之眼"与"科技之心"的概念
    """
    img = Image.new('RGB', (size, size), bg_color)
    draw = ImageDraw.Draw(img)
    
    center = size // 2
    scale = size / 1024
    
    # 线条粗细
    line_width = max(2, int(3 * scale))
    
    # 外圈 - 代表监控的360度视野
    outer_radius = int(380 * scale)
    draw.ellipse(
        [center - outer_radius, center - outer_radius, 
         center + outer_radius, center + outer_radius],
        outline=line_color, width=line_width
    )
    
    # 内圈 - 代表聚焦与精确
    inner_radius = int(280 * scale)
    draw.ellipse(
        [center - inner_radius, center - inner_radius,
         center + inner_radius, center + inner_radius],
        outline=line_color, width=line_width
    )
    
    # 中心核心 - AI之眼
    core_radius = int(80 * scale)
    draw.ellipse(
        [center - core_radius, center - core_radius,
         center + core_radius, center + core_radius],
        outline=line_color, width=line_width
    )
    
    # 十字准星 - 精确监控的象征
    cross_length = int(180 * scale)
    # 水平线
    draw.line([
        (center - cross_length, center),
        (center - core_radius - 10, center)
    ], fill=line_color, width=line_width)
    draw.line([
        (center + core_radius + 10, center),
        (center + cross_length, center)
    ], fill=line_color, width=line_width)
    # 垂直线
    draw.line([
        (center, center - cross_length),
        (center, center - core_radius - 10)
    ], fill=line_color, width=line_width)
    draw.line([
        (center, center + core_radius + 10),
        (center, center + cross_length)
    ], fill=line_color, width=line_width)
    
    # 四象限连接线 - 神经网络/数据流
    for angle in [45, 135, 225, 315]:
        rad = math.radians(angle)
        start_r = int(290 * scale)
        end_r = int(370 * scale)
        x1 = center + start_r * math.cos(rad)
        y1 = center + start_r * math.sin(rad)
        x2 = center + end_r * math.cos(rad)
        y2 = center + end_r * math.sin(rad)
        draw.line([(x1, y1), (x2, y2)], fill=line_color, width=line_width)
    
    # 中心点
    dot_radius = int(15 * scale)
    draw.ellipse(
        [center - dot_radius, center - dot_radius,
         center + dot_radius, center + dot_radius],
        fill=line_color
    )
    
    return img

def create_logo_variants():
    """创建Logo的各种变体"""
    variants = []
    
    # 1. 主Logo - 白底黑线
    logo_main = create_xunjianbao_logo(1024, (255, 255, 255), (0, 0, 0))
    logo_main.save(f"{OUTPUT_DIR}/logo_main.png", "PNG")
    variants.append(("主Logo (白底黑线)", "logo_main.png"))
    
    # 2. 深色版本
    logo_dark = create_xunjianbao_logo(1024, (13, 17, 23), (255, 255, 255))
    logo_dark.save(f"{OUTPUT_DIR}/logo_dark.png", "PNG")
    variants.append(("深色版本", "logo_dark.png"))
    
    # 3. 小尺寸版本 (用于favicon)
    logo_small = create_xunjianbao_logo(64, (255, 255, 255), (0, 0, 0))
    logo_small.save(f"{OUTPUT_DIR}/logo_favicon.png", "PNG")
    variants.append(("Favicon", "logo_favicon.png"))
    
    # 4. 带文字的完整Logo
    logo_with_text = create_logo_with_text()
    logo_with_text.save(f"{OUTPUT_DIR}/logo_with_text.png", "PNG")
    variants.append(("带文字Logo", "logo_with_text.png"))
    
    return variants

def create_logo_with_text():
    """创建带文字的Logo"""
    width, height = 1600, 600
    img = Image.new('RGB', (width, height), (255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # 绘制Logo图形部分
    logo_size = 480
    logo = create_xunjianbao_logo(logo_size, (255, 255, 255), (0, 0, 0))
    img.paste(logo, (100, (height - logo_size) // 2))
    
    # 添加文字
    try:
        # 尝试使用系统字体
        font_large = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 120)
        font_small = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 48)
    except:
        font_large = ImageFont.load_default()
        font_small = ImageFont.load_default()
    
    # 品牌名
    draw.text((650, 180), "巡检宝", fill=(0, 0, 0), font=font_large)
    
    # 英文名
    draw.text((660, 320), "XUNJIANBAO", fill=(100, 100, 100), font=font_small)
    
    # 标语
    draw.text((660, 390), "智能工业监控平台", fill=(150, 150, 150), font=font_small)
    
    return img

def create_theme_preview():
    """创建三档主题预览"""
    width, height = 1800, 1200
    img = Image.new('RGB', (width, height), (245, 245, 245))
    draw = ImageDraw.Draw(img)
    
    # 标题
    try:
        font_title = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 48)
        font_label = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 32)
    except:
        font_title = ImageFont.load_default()
        font_label = ImageFont.load_default()
    
    draw.text((width//2 - 200, 40), "巡检宝 · 三档主题系统", fill=(30, 30, 30), font=font_title)
    
    # 三个主题的配色
    themes = [
        ("深境模式 (Deep)", "24/7监控室", (13, 17, 23), (22, 27, 34), (48, 54, 61), (139, 148, 158), (255, 255, 255)),
        ("均衡模式 (Balanced)", "日常办公", (30, 35, 42), (45, 52, 60), (75, 82, 90), (160, 168, 178), (240, 242, 245)),
        ("清境模式 (Clear)", "演示汇报", (245, 247, 250), (255, 255, 255), (220, 225, 230), (100, 110, 120), (30, 35, 42)),
    ]
    
    card_width = 520
    card_height = 800
    start_x = 80
    gap = 60
    
    for i, (name, desc, bg1, bg2, border, text2, text1) in enumerate(themes):
        x = start_x + i * (card_width + gap)
        y = 150
        
        # 主题卡片背景
        draw.rectangle([x, y, x + card_width, y + card_height], fill=bg1, outline=border, width=2)
        
        # 标题区域
        draw.rectangle([x, y, x + card_width, y + 100], fill=bg2)
        draw.text((x + 30, y + 30), name, fill=text1, font=font_label)
        draw.text((x + 30, y + 65), desc, fill=text2, font=ImageFont.load_default() if isinstance(font_label, ImageFont.FreeTypeFont) else font_label)
        
        # 模拟界面元素
        # 顶部栏
        draw.rectangle([x + 20, y + 130, x + card_width - 20, y + 180], fill=bg2, outline=border)
        
        # 侧边栏
        draw.rectangle([x + 20, y + 200, x + 80, y + 700], fill=bg2, outline=border)
        
        # 内容区域 - 模拟数据卡片
        for row in range(3):
            for col in range(2):
                card_x = x + 100 + col * 200
                card_y = y + 200 + row * 170
                draw.rectangle([card_x, card_y, card_x + 180, card_y + 150], fill=bg2, outline=border)
                # 卡片内容线
                draw.rectangle([card_x + 15, card_y + 20, card_x + 150, card_y + 35], fill=border)
                draw.rectangle([card_x + 15, card_y + 50, card_x + 100, card_y + 60], fill=border)
                draw.rectangle([card_x + 15, card_y + 80, card_x + 150, card_y + 130], fill=border)
        
        # 配色展示
        colors_y = y + 720
        colors = [bg1, bg2, border, text2, text1]
        for ci, color in enumerate(colors):
            draw.rectangle([x + 20 + ci * 95, colors_y, x + 105 + ci * 95, colors_y + 60], fill=color, outline=(100, 100, 100) if color == (255, 255, 255) else None)
    
    img.save(f"{OUTPUT_DIR}/theme_preview.png", "PNG")
    return "theme_preview.png"

def create_dashboard_mockup():
    """创建数据看板界面设计"""
    # 深境模式下的数据看板
    width, height = 1920, 1080
    
    # 配色
    bg_primary = (13, 17, 23)
    bg_secondary = (22, 27, 34)
    bg_tertiary = (33, 38, 45)
    border = (48, 54, 61)
    text_primary = (230, 237, 243)
    text_secondary = (139, 148, 158)
    accent = (88, 166, 255)
    success = (63, 185, 80)
    warning = (210, 153, 34)
    error = (248, 81, 73)
    
    img = Image.new('RGB', (width, height), bg_primary)
    draw = ImageDraw.Draw(img)
    
    try:
        font_title = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 28)
        font_text = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 16)
        font_small = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 13)
        font_number = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 36)
    except:
        font_title = ImageFont.load_default()
        font_text = ImageFont.load_default()
        font_small = ImageFont.load_default()
        font_number = ImageFont.load_default()
    
    # 左侧导航栏 - 极简图标风格
    nav_width = 72
    draw.rectangle([0, 0, nav_width, height], fill=bg_secondary)
    
    # Logo位置
    logo = create_xunjianbao_logo(48, bg_secondary, text_primary)
    img.paste(logo, (12, 20))
    
    # 导航图标 - 简化表示
    nav_items = [
        ("监控大屏", True),
        ("视频监控", False),
        ("媒体库", False),
        ("告警中心", True),
        ("AI助手", False),
        ("数据报表", False),
    ]
    
    y_pos = 120
    for item_name, is_active in nav_items:
        if is_active:
            draw.rectangle([8, y_pos, nav_width - 8, y_pos + 48], fill=bg_tertiary, outline=accent, width=2)
            # 激活指示条
            draw.rectangle([0, y_pos + 8, 3, y_pos + 40], fill=accent)
        else:
            draw.rectangle([8, y_pos, nav_width - 8, y_pos + 48], fill=bg_secondary)
        y_pos += 64
    
    # 顶部栏
    draw.rectangle([nav_width, 0, width, 64], fill=bg_secondary, outline=border)
    draw.text((nav_width + 24, 20), "监控大屏", fill=text_primary, font=font_title)
    draw.text((nav_width + 150, 26), "/ 概览", fill=text_secondary, font=font_text)
    
    # 右侧用户信息
    draw.text((width - 200, 22), "管理员", fill=text_secondary, font=font_text)
    draw.ellipse([width - 60, 16, width - 28, 48], fill=accent)
    
    # 主内容区 - 统计卡片
    card_y = 100
    stats = [
        ("设备总数", "24", "在线 21 / 离线 3", accent),
        ("今日告警", "12", "待处理 5", warning),
        ("AI 检测", "156", "今日识别次数", accent),
        ("在线率", "88%", "设备在线状态", success),
    ]
    
    card_width = 420
    for i, (label, value, subtext, color) in enumerate(stats):
        x = nav_width + 24 + i * (card_width + 24)
        # 卡片背景
        draw.rectangle([x, card_y, x + card_width, card_y + 140], fill=bg_secondary, outline=border)
        # 顶部色条
        draw.rectangle([x, card_y, x + card_width, card_y + 3], fill=color)
        # 内容
        draw.text((x + 20, card_y + 20), label, fill=text_secondary, font=font_text)
        draw.text((x + 20, card_y + 50), value, fill=text_primary, font=font_number)
        draw.text((x + 20, card_y + 100), subtext, fill=text_secondary, font=font_small)
    
    # 设备状态区域
    section_y = 280
    draw.rectangle([nav_width + 24, section_y, nav_width + 900, section_y + 400], fill=bg_secondary, outline=border)
    draw.text((nav_width + 44, section_y + 20), "设备状态概览", fill=text_primary, font=font_title)
    
    # 在线设备指示
    draw.rectangle([nav_width + 44, section_y + 70, nav_width + 860, section_y + 140], fill=bg_tertiary, outline=border)
    draw.ellipse([nav_width + 64, section_y + 90, nav_width + 104, section_y + 130], fill=success)
    draw.text((nav_width + 120, section_y + 95), "在线设备", fill=text_primary, font=font_text)
    draw.text((nav_width + 120, section_y + 115), "21 台设备正常运行", fill=text_secondary, font=font_small)
    draw.text((nav_width + 750, section_y + 100), "● 正常", fill=success, font=font_text)
    
    # 离线设备指示
    draw.rectangle([nav_width + 44, section_y + 160, nav_width + 860, section_y + 230], fill=bg_tertiary, outline=border)
    draw.ellipse([nav_width + 64, section_y + 180, nav_width + 104, section_y + 220], fill=error)
    draw.text((nav_width + 120, section_y + 185), "离线设备", fill=text_primary, font=font_text)
    draw.text((nav_width + 120, section_y + 205), "3 台设备离线", fill=text_secondary, font=font_small)
    draw.text((nav_width + 750, section_y + 190), "● 离线", fill=error, font=font_text)
    
    # 最近告警区域
    alert_x = nav_width + 948
    draw.rectangle([alert_x, section_y, width - 24, section_y + 400], fill=bg_secondary, outline=border)
    draw.text((alert_x + 20, section_y + 20), "最近告警", fill=text_primary, font=font_title)
    
    # 告警列表
    alerts = [
        ("人员入侵", "摄像头-01", "2分钟前", error),
        ("设备离线", "无人机-A", "5分钟前", warning),
        ("异常行为", "摄像头-05", "15分钟前", text_secondary),
    ]
    
    alert_y = section_y + 70
    for alert_type, device, time, alert_color in alerts:
        draw.rectangle([alert_x + 20, alert_y, width - 44, alert_y + 80], fill=bg_tertiary, outline=border)
        draw.text((alert_x + 40, alert_y + 15), alert_type, fill=alert_color, font=font_text)
        draw.text((alert_x + 40, alert_y + 40), device, fill=text_secondary, font=font_small)
        draw.text((alert_x + 350, alert_y + 30), time, fill=text_secondary, font=font_small)
        alert_y += 95
    
    # AI助手快捷入口
    ai_y = section_y + 430
    draw.rectangle([nav_width + 24, ai_y, width - 24, ai_y + 120], fill=bg_secondary, outline=accent)
    draw.rectangle([nav_width + 24, ai_y, nav_width + 27, ai_y + 120], fill=accent)
    
    # AI图标
    draw.ellipse([nav_width + 50, ai_y + 30, nav_width + 90, ai_y + 70], fill=accent)
    draw.text((nav_width + 110, ai_y + 35), "AI 智能助手", fill=text_primary, font=font_title)
    draw.text((nav_width + 110, ai_y + 65), "智能分析监控数据，自动识别异常行为", fill=text_secondary, font=font_text)
    
    img.save(f"{OUTPUT_DIR}/dashboard_mockup.png", "PNG")
    return "dashboard_mockup.png"

def main():
    print("🎨 巡检宝设计系统生成中...")
    print("=" * 50)
    
    # 生成Logo
    print("\n📌 生成Logo变体...")
    logo_variants = create_logo_variants()
    for name, filename in logo_variants:
        print(f"   ✓ {name}: {filename}")
    
    # 生成主题预览
    print("\n🎨 生成三档主题预览...")
    theme_file = create_theme_preview()
    print(f"   ✓ 主题预览: {theme_file}")
    
    # 生成数据看板
    print("\n📊 生成数据看板界面...")
    dashboard_file = create_dashboard_mockup()
    print(f"   ✓ 数据看板: {dashboard_file}")
    
    print("\n" + "=" * 50)
    print(f"✅ 所有设计文件已保存到: {OUTPUT_DIR}")
    print("\n生成的文件:")
    for f in os.listdir(OUTPUT_DIR):
        print(f"   📄 {f}")

if __name__ == "__main__":
    main()
