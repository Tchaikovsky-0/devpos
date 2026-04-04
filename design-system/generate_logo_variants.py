#!/usr/bin/env python3
"""
巡检宝 Logo 多方案设计生成器
提供不同线条粗细和风格的Logo变体
"""

from PIL import Image, ImageDraw, ImageFont
import math
import os

OUTPUT_DIR = "/Users/fanxing/xunjianbao/design-system/output"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def create_logo_variant(size, style="medium", bg_color=(255, 255, 255), line_color=(0, 0, 0)):
    """
    创建不同风格的Logo
    
    styles:
    - thin: 细线条，极简风格
    - medium: 中等线条，平衡风格
    - bold: 粗线条，力量感
    - heavy: 超粗线条，工业感
    - outline: 双线轮廓，科技感
    - geometric: 纯几何，现代感
    """
    img = Image.new('RGB', (size, size), bg_color)
    draw = ImageDraw.Draw(img)
    
    center = size // 2
    scale = size / 1024
    
    # 根据风格设置线条粗细
    line_widths = {
        "thin": max(1, int(2 * scale)),
        "medium": max(2, int(4 * scale)),
        "bold": max(3, int(6 * scale)),
        "heavy": max(4, int(10 * scale)),
        "outline": max(2, int(3 * scale)),
        "geometric": max(2, int(5 * scale)),
    }
    
    line_width = line_widths.get(style, 3)
    
    if style == "thin":
        # 方案1: 极简细线 - 优雅精致
        _draw_thin_style(draw, center, scale, line_width, line_color)
        
    elif style == "medium":
        # 方案2: 中等线条 - 平衡专业
        _draw_medium_style(draw, center, scale, line_width, line_color)
        
    elif style == "bold":
        # 方案3: 粗线条 - 力量感
        _draw_bold_style(draw, center, scale, line_width, line_color)
        
    elif style == "heavy":
        # 方案4: 超粗线条 - 工业厚重感
        _draw_heavy_style(draw, center, scale, line_width, line_color)
        
    elif style == "outline":
        # 方案5: 双线轮廓 - 科技未来感
        _draw_outline_style(draw, center, scale, line_width, line_color)
        
    elif style == "geometric":
        # 方案6: 纯几何 - 现代极简
        _draw_geometric_style(draw, center, scale, line_width, line_color)
    
    return img

def _draw_thin_style(draw, center, scale, line_width, color):
    """极简细线风格 - 优雅精致"""
    # 外圈 - 细线
    outer_r = int(380 * scale)
    draw.ellipse([center - outer_r, center - outer_r, center + outer_r, center + outer_r],
                 outline=color, width=line_width)
    
    # 内圈
    inner_r = int(280 * scale)
    draw.ellipse([center - inner_r, center - inner_r, center + inner_r, center + inner_r],
                 outline=color, width=line_width)
    
    # 核心 - 小圆点
    core_r = int(40 * scale)
    draw.ellipse([center - core_r, center - core_r, center + core_r, center + core_r],
                 fill=color)
    
    # 十字准星 - 细线
    cross_len = int(200 * scale)
    gap = int(50 * scale)
    
    # 水平线
    draw.line([(center - cross_len, center), (center - gap, center)], fill=color, width=line_width)
    draw.line([(center + gap, center), (center + cross_len, center)], fill=color, width=line_width)
    # 垂直线
    draw.line([(center, center - cross_len), (center, center - gap)], fill=color, width=line_width)
    draw.line([(center, center + gap), (center, center + cross_len)], fill=color, width=line_width)
    
    # 四象限标记 - 小点
    for angle in [45, 135, 225, 315]:
        rad = math.radians(angle)
        r = int(330 * scale)
        x = center + r * math.cos(rad)
        y = center + r * math.sin(rad)
        dot_r = int(6 * scale)
        draw.ellipse([x - dot_r, y - dot_r, x + dot_r, y + dot_r], fill=color)

def _draw_medium_style(draw, center, scale, line_width, color):
    """中等线条 - 平衡专业（原版改进）"""
    # 外圈
    outer_r = int(380 * scale)
    draw.ellipse([center - outer_r, center - outer_r, center + outer_r, center + outer_r],
                 outline=color, width=line_width)
    
    # 内圈
    inner_r = int(280 * scale)
    draw.ellipse([center - inner_r, center - inner_r, center + inner_r, center + inner_r],
                 outline=color, width=line_width)
    
    # 核心
    core_r = int(60 * scale)
    draw.ellipse([center - core_r, center - core_r, center + core_r, center + core_r],
                 outline=color, width=line_width)
    
    # 中心点
    dot_r = int(15 * scale)
    draw.ellipse([center - dot_r, center - dot_r, center + dot_r, center + dot_r], fill=color)
    
    # 十字准星
    cross_len = int(180 * scale)
    gap = int(70 * scale)
    
    draw.line([(center - cross_len, center), (center - gap, center)], fill=color, width=line_width)
    draw.line([(center + gap, center), (center + cross_len, center)], fill=color, width=line_width)
    draw.line([(center, center - cross_len), (center, center - gap)], fill=color, width=line_width)
    draw.line([(center, center + gap), (center, center + cross_len)], fill=color, width=line_width)
    
    # 四象限短线
    for angle in [45, 135, 225, 315]:
        rad = math.radians(angle)
        start_r = int(300 * scale)
        end_r = int(360 * scale)
        x1 = center + start_r * math.cos(rad)
        y1 = center + start_r * math.sin(rad)
        x2 = center + end_r * math.cos(rad)
        y2 = center + end_r * math.sin(rad)
        draw.line([(x1, y1), (x2, y2)], fill=color, width=line_width)

def _draw_bold_style(draw, center, scale, line_width, color):
    """粗线条 - 力量感强"""
    # 外圈 - 粗线
    outer_r = int(380 * scale)
    draw.ellipse([center - outer_r, center - outer_r, center + outer_r, center + outer_r],
                 outline=color, width=line_width)
    
    # 内圈 - 粗线
    inner_r = int(280 * scale)
    draw.ellipse([center - inner_r, center - inner_r, center + inner_r, center + inner_r],
                 outline=color, width=line_width)
    
    # 核心 - 实心圆
    core_r = int(70 * scale)
    draw.ellipse([center - core_r, center - core_r, center + core_r, center + core_r],
                 fill=color)
    
    # 十字准星 - 粗线
    cross_len = int(170 * scale)
    gap = int(80 * scale)
    
    draw.line([(center - cross_len, center), (center - gap, center)], fill=color, width=line_width)
    draw.line([(center + gap, center), (center + cross_len, center)], fill=color, width=line_width)
    draw.line([(center, center - cross_len), (center, center - gap)], fill=color, width=line_width)
    draw.line([(center, center + gap), (center, center + cross_len)], fill=color, width=line_width)
    
    # 四象限粗短线
    for angle in [45, 135, 225, 315]:
        rad = math.radians(angle)
        start_r = int(290 * scale)
        end_r = int(370 * scale)
        x1 = center + start_r * math.cos(rad)
        y1 = center + start_r * math.sin(rad)
        x2 = center + end_r * math.cos(rad)
        y2 = center + end_r * math.sin(rad)
        draw.line([(x1, y1), (x2, y2)], fill=color, width=line_width)

def _draw_heavy_style(draw, center, scale, line_width, color):
    """超粗线条 - 工业厚重感"""
    # 外圈 - 超粗
    outer_r = int(370 * scale)
    draw.ellipse([center - outer_r, center - outer_r, center + outer_r, center + outer_r],
                 outline=color, width=line_width)
    
    # 内圈 - 超粗
    inner_r = int(270 * scale)
    draw.ellipse([center - inner_r, center - inner_r, center + inner_r, center + inner_r],
                 outline=color, width=line_width)
    
    # 核心 - 大实心
    core_r = int(80 * scale)
    draw.ellipse([center - core_r, center - core_r, center + core_r, center + core_r],
                 fill=color)
    
    # 十字准星 - 超粗
    cross_len = int(160 * scale)
    gap = int(90 * scale)
    
    draw.line([(center - cross_len, center), (center - gap, center)], fill=color, width=line_width)
    draw.line([(center + gap, center), (center + cross_len, center)], fill=color, width=line_width)
    draw.line([(center, center - cross_len), (center, center - gap)], fill=color, width=line_width)
    draw.line([(center, center + gap), (center, center + cross_len)], fill=color, width=line_width)
    
    # 四象限粗标记
    for angle in [45, 135, 225, 315]:
        rad = math.radians(angle)
        start_r = int(280 * scale)
        end_r = int(360 * scale)
        x1 = center + start_r * math.cos(rad)
        y1 = center + start_r * math.sin(rad)
        x2 = center + end_r * math.cos(rad)
        y2 = center + end_r * math.sin(rad)
        draw.line([(x1, y1), (x2, y2)], fill=color, width=line_width)

def _draw_outline_style(draw, center, scale, line_width, color):
    """双线轮廓 - 科技未来感"""
    # 外圈 - 双线
    outer_r1 = int(390 * scale)
    outer_r2 = int(370 * scale)
    draw.ellipse([center - outer_r1, center - outer_r1, center + outer_r1, center + outer_r1],
                 outline=color, width=line_width)
    draw.ellipse([center - outer_r2, center - outer_r2, center + outer_r2, center + outer_r2],
                 outline=color, width=line_width)
    
    # 内圈 - 双线
    inner_r1 = int(290 * scale)
    inner_r2 = int(270 * scale)
    draw.ellipse([center - inner_r1, center - inner_r1, center + inner_r1, center + inner_r1],
                 outline=color, width=line_width)
    draw.ellipse([center - inner_r2, center - inner_r2, center + inner_r2, center + inner_r2],
                 outline=color, width=line_width)
    
    # 核心 - 双线
    core_r1 = int(70 * scale)
    core_r2 = int(50 * scale)
    draw.ellipse([center - core_r1, center - core_r1, center + core_r1, center + core_r1],
                 outline=color, width=line_width)
    draw.ellipse([center - core_r2, center - core_r2, center + core_r2, center + core_r2],
                 fill=color)
    
    # 十字准星 - 双线效果
    cross_len = int(180 * scale)
    gap = int(80 * scale)
    offset = int(8 * scale)
    
    for dx in [-offset, 0, offset]:
        draw.line([(center - cross_len, center + dx), (center - gap, center + dx)], fill=color, width=1)
        draw.line([(center + gap, center + dx), (center + cross_len, center + dx)], fill=color, width=1)
        draw.line([(center + dx, center - cross_len), (center + dx, center - gap)], fill=color, width=1)
        draw.line([(center + dx, center + gap), (center + dx, center + cross_len)], fill=color, width=1)
    
    # 四象限双线标记
    for angle in [45, 135, 225, 315]:
        rad = math.radians(angle)
        for dr in [0, int(12 * scale)]:
            start_r = int(300 * scale) + dr
            end_r = int(360 * scale) + dr
            x1 = center + start_r * math.cos(rad)
            y1 = center + start_r * math.sin(rad)
            x2 = center + end_r * math.cos(rad)
            y2 = center + end_r * math.sin(rad)
            draw.line([(x1, y1), (x2, y2)], fill=color, width=1)

def _draw_geometric_style(draw, center, scale, line_width, color):
    """纯几何 - 现代极简"""
    # 外圈 - 八边形效果（用圆模拟）
    outer_r = int(380 * scale)
    draw.ellipse([center - outer_r, center - outer_r, center + outer_r, center + outer_r],
                 outline=color, width=line_width)
    
    # 正方形旋转45度（菱形）
    diamond_r = int(280 * scale)
    points = []
    for angle in [45, 135, 225, 315]:
        rad = math.radians(angle)
        x = center + diamond_r * math.cos(rad)
        y = center + diamond_r * math.sin(rad)
        points.append((x, y))
    draw.polygon(points, outline=color)
    
    # 核心圆
    core_r = int(60 * scale)
    draw.ellipse([center - core_r, center - core_r, center + core_r, center + core_r],
                 fill=color)
    
    # 十字线
    cross_len = int(380 * scale)
    draw.line([(center - cross_len, center), (center + cross_len, center)], fill=color, width=line_width)
    draw.line([(center, center - cross_len), (center, center + cross_len)], fill=color, width=line_width)
    
    # 对角线
    diag_len = int(270 * scale)
    for angle in [45, 135, 225, 315]:
        rad = math.radians(angle)
        x1 = center + diag_len * math.cos(rad)
        y1 = center + diag_len * math.sin(rad)
        x2 = center + (diag_len - int(80 * scale)) * math.cos(rad)
        y2 = center + (diag_len - int(80 * scale)) * math.sin(rad)
        draw.line([(x1, y1), (x2, y2)], fill=color, width=line_width)

def create_comparison_sheet():
    """创建Logo对比展示图"""
    width, height = 2400, 1400
    img = Image.new('RGB', (width, height), (255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    try:
        font_title = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 48)
        font_label = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 28)
        font_desc = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 20)
    except:
        font_title = ImageFont.load_default()
        font_label = ImageFont.load_default()
        font_desc = ImageFont.load_default()
    
    # 标题
    draw.text((80, 60), "巡检宝 Logo 设计方案对比", fill=(30, 30, 30), font=font_title)
    draw.text((80, 120), "Precision Order · 精密秩序", fill=(100, 100, 100), font=font_desc)
    
    # 六个方案
    styles = [
        ("thin", "方案一：极简细线", "优雅精致，适合科技品牌", "2px"),
        ("medium", "方案二：中等线条", "平衡专业，推荐方案", "4px"),
        ("bold", "方案三：粗线条", "力量感强，视觉冲击", "6px"),
        ("heavy", "方案四：超粗线条", "工业厚重，稳重大气", "10px"),
        ("outline", "方案五：双线轮廓", "科技未来，层次丰富", "3px双线"),
        ("geometric", "方案六：纯几何", "现代极简，独特识别", "5px"),
    ]
    
    logo_size = 320
    cols = 3
    start_x = 120
    start_y = 220
    gap_x = 750
    gap_y = 550
    
    for i, (style, title, desc, line_info) in enumerate(styles):
        col = i % cols
        row = i // cols
        x = start_x + col * gap_x
        y = start_y + row * gap_y
        
        # 生成Logo
        logo = create_logo_variant(logo_size, style, (255, 255, 255), (0, 0, 0))
        img.paste(logo, (x, y))
        
        # 方案名称
        draw.text((x, y + logo_size + 20), title, fill=(30, 30, 30), font=font_label)
        
        # 描述
        draw.text((x, y + logo_size + 60), desc, fill=(100, 100, 100), font=font_desc)
        
        # 线条信息
        draw.text((x, y + logo_size + 90), f"线条粗细: {line_info}", fill=(150, 150, 150), font=font_desc)
        
        # 边框
        draw.rectangle([x - 20, y - 20, x + logo_size + 20, y + logo_size + 140], 
                      outline=(220, 220, 220), width=2)
    
    img.save(f"{OUTPUT_DIR}/logo_comparison.png", "PNG")
    return "logo_comparison.png"

def create_single_logos():
    """生成单个Logo文件"""
    styles = ["thin", "medium", "bold", "heavy", "outline", "geometric"]
    
    for style in styles:
        # 白底黑线
        logo = create_logo_variant(1024, style, (255, 255, 255), (0, 0, 0))
        logo.save(f"{OUTPUT_DIR}/logo_{style}.png", "PNG")
        
        # 深色版本
        logo_dark = create_logo_variant(1024, style, (13, 17, 23), (255, 255, 255))
        logo_dark.save(f"{OUTPUT_DIR}/logo_{style}_dark.png", "PNG")
        
        print(f"  ✓ logo_{style}.png & logo_{style}_dark.png")

def create_logo_with_text_variants():
    """创建带文字的Logo变体"""
    width, height = 1600, 500
    
    try:
        font_brand = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 72)
        font_en = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 32)
        font_slogan = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 24)
    except:
        font_brand = ImageFont.load_default()
        font_en = ImageFont.load_default()
        font_slogan = ImageFont.load_default()
    
    styles = ["medium", "bold", "heavy"]
    
    for style in styles:
        img = Image.new('RGB', (width, height), (255, 255, 255))
        draw = ImageDraw.Draw(img)
        
        # Logo图形
        logo_size = 280
        logo = create_logo_variant(logo_size, style, (255, 255, 255), (0, 0, 0))
        img.paste(logo, (80, (height - logo_size) // 2))
        
        # 品牌名
        draw.text((420, 140), "巡检宝", fill=(0, 0, 0), font=font_brand)
        
        # 英文名
        draw.text((425, 230), "XUNJIANBAO", fill=(100, 100, 100), font=font_en)
        
        # 标语
        draw.text((425, 280), "智能工业监控平台", fill=(150, 150, 150), font=font_slogan)
        
        # 装饰线
        line_y = 340
        draw.line([(425, line_y), (700, line_y)], fill=(200, 200, 200), width=2)
        
        img.save(f"{OUTPUT_DIR}/logo_{style}_with_text.png", "PNG")
        print(f"  ✓ logo_{style}_with_text.png")

def main():
    print("🎨 巡检宝 Logo 多方案设计生成中...")
    print("=" * 60)
    
    print("\n📌 生成对比展示图...")
    comparison_file = create_comparison_sheet()
    print(f"   ✓ {comparison_file}")
    
    print("\n📌 生成单个Logo文件（6种风格 × 2种背景）...")
    create_single_logos()
    
    print("\n📌 生成带文字的Logo...")
    create_logo_with_text_variants()
    
    print("\n" + "=" * 60)
    print(f"✅ 所有Logo文件已保存到: {OUTPUT_DIR}")
    print("\n生成的文件:")
    for f in sorted(os.listdir(OUTPUT_DIR)):
        if f.startswith('logo_'):
            print(f"   📄 {f}")

if __name__ == "__main__":
    main()
