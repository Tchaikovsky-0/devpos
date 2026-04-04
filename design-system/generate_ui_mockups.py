#!/usr/bin/env python3
"""
巡检宝核心页面UI设计生成器
"""

from PIL import Image, ImageDraw, ImageFont
import math
import os

OUTPUT_DIR = "/Users/fanxing/xunjianbao/design-system/output"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 深境模式配色
DEEP_THEME = {
    'bg_primary': (13, 17, 23),
    'bg_secondary': (22, 27, 34),
    'bg_tertiary': (33, 38, 45),
    'bg_hover': (48, 54, 61),
    'border': (48, 54, 61),
    'text_primary': (230, 237, 243),
    'text_secondary': (139, 148, 158),
    'text_tertiary': (88, 96, 105),
    'accent': (88, 166, 255),
    'accent_muted': (88, 166, 255, 26),
    'success': (63, 185, 80),
    'warning': (210, 153, 34),
    'error': (248, 81, 73),
    'info': (88, 166, 255),
}

def get_fonts():
    """获取字体"""
    try:
        return {
            'title': ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 24),
            'subtitle': ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 18),
            'text': ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 14),
            'small': ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 12),
            'number': ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 32),
            'large_num': ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 48),
        }
    except:
        default = ImageFont.load_default()
        return {k: default for k in ['title', 'subtitle', 'text', 'small', 'number', 'large_num']}

def draw_rounded_rect(draw, xy, radius, fill, outline=None, width=1):
    """绘制圆角矩形"""
    x1, y1, x2, y2 = xy
    r = radius
    
    # 主体矩形
    draw.rectangle([x1 + r, y1, x2 - r, y2], fill=fill)
    draw.rectangle([x1, y1 + r, x2, y2 - r], fill=fill)
    
    # 四个圆角
    draw.ellipse([x1, y1, x1 + r * 2, y1 + r * 2], fill=fill)
    draw.ellipse([x2 - r * 2, y1, x2, y1 + r * 2], fill=fill)
    draw.ellipse([x1, y2 - r * 2, x1 + r * 2, y2], fill=fill)
    draw.ellipse([x2 - r * 2, y2 - r * 2, x2, y2], fill=fill)
    
    if outline:
        # 绘制边框
        draw.arc([x1, y1, x1 + r * 2, y1 + r * 2], 180, 270, fill=outline, width=width)
        draw.arc([x2 - r * 2, y1, x2, y1 + r * 2], 270, 360, fill=outline, width=width)
        draw.arc([x1, y2 - r * 2, x1 + r * 2, y2], 90, 180, fill=outline, width=width)
        draw.arc([x2 - r * 2, y2 - r * 2, x2, y2], 0, 90, fill=outline, width=width)
        draw.line([(x1 + r, y1), (x2 - r, y1)], fill=outline, width=width)
        draw.line([(x1 + r, y2), (x2 - r, y2)], fill=outline, width=width)
        draw.line([(x1, y1 + r), (x1, y2 - r)], fill=outline, width=width)
        draw.line([(x2, y1 + r), (x2, y2 - r)], fill=outline, width=width)

def create_monitor_interface():
    """创建视频监控界面 - 专业监控室风格"""
    width, height = 1920, 1080
    t = DEEP_THEME
    fonts = get_fonts()
    
    img = Image.new('RGB', (width, height), t['bg_primary'])
    draw = ImageDraw.Draw(img)
    
    nav_width = 72
    sidebar_width = 280
    
    # 左侧导航
    draw.rectangle([0, 0, nav_width, height], fill=t['bg_secondary'])
    
    # Logo
    logo_size = 48
    logo_x = (nav_width - logo_size) // 2
    draw.ellipse([logo_x, 20, logo_x + logo_size, 20 + logo_size], outline=t['text_primary'], width=2)
    draw.ellipse([logo_x + 12, 32, logo_x + 36, 56], outline=t['text_primary'], width=2)
    draw.ellipse([logo_x + 18, 38, logo_x + 30, 50], fill=t['text_primary'])
    
    # 激活的监控图标
    draw.rectangle([8, 100, nav_width - 8, 156], fill=t['bg_tertiary'], outline=t['accent'], width=2)
    draw.rectangle([0, 108, 3, 148], fill=t['accent'])
    
    # 其他导航图标位置
    nav_y = 180
    for _ in range(5):
        draw.rectangle([16, nav_y, nav_width - 16, nav_y + 40], outline=t['border'], width=1)
        nav_y += 56
    
    # 设备列表面板
    draw.rectangle([nav_width, 0, nav_width + sidebar_width, height], fill=t['bg_secondary'], outline=t['border'])
    
    # 设备列表标题
    draw.text((nav_width + 20, 20), "设备列表", fill=t['text_primary'], font=fonts['title'])
    draw.text((nav_width + 20, 55), "在线 6 / 总计 8", fill=t['text_secondary'], font=fonts['small'])
    
    # 设备项
    devices = [
        ("摄像头-01", "在线", t['success']),
        ("摄像头-02", "在线", t['success']),
        ("无人机-A", "在线", t['success']),
        ("无人机-B", "离线", t['error']),
        ("传感器-01", "在线", t['success']),
        ("传感器-02", "在线", t['success']),
    ]
    
    y = 100
    for name, status, color in devices:
        # 设备卡片
        draw.rectangle([nav_width + 12, y, nav_width + sidebar_width - 12, y + 64], 
                      fill=t['bg_tertiary'], outline=t['border'])
        
        # 状态指示点
        draw.ellipse([nav_width + 24, y + 24, nav_width + 36, y + 36], fill=color)
        
        # 设备名
        draw.text((nav_width + 48, y + 14), name, fill=t['text_primary'], font=fonts['text'])
        draw.text((nav_width + 48, y + 36), status, fill=color, font=fonts['small'])
        
        y += 76
    
    # 主内容区 - 顶部工具栏
    content_x = nav_width + sidebar_width
    draw.rectangle([content_x, 0, width, 64], fill=t['bg_secondary'], outline=t['border'])
    draw.text((content_x + 24, 20), "实时监控", fill=t['text_primary'], font=fonts['title'])
    
    # 布局切换按钮
    layouts = ["1x1", "2x2", "3x3", "4x4"]
    lx = width - 300
    for layout in layouts:
        if layout == "2x2":
            draw.rectangle([lx, 16, lx + 50, 48], fill=t['accent'])
            draw.text((lx + 12, 22), layout, fill=t['bg_primary'], font=fonts['small'])
        else:
            draw.rectangle([lx, 16, lx + 50, 48], outline=t['border'])
            draw.text((lx + 12, 22), layout, fill=t['text_secondary'], font=fonts['small'])
        lx += 60
    
    # YOLO开关
    draw.rectangle([width - 180, 16, width - 100, 48], fill=t['success'])
    draw.text((width - 160, 22), "YOLO ON", fill=t['bg_primary'], font=fonts['small'])
    
    # 视频网格 - 2x2布局
    grid_start_y = 80
    grid_width = (width - content_x - 48) // 2
    grid_height = (height - grid_start_y - 48) // 2
    
    for row in range(2):
        for col in range(2):
            x = content_x + 24 + col * (grid_width + 16)
            y = grid_start_y + row * (grid_height + 16)
            
            # 视频框
            draw.rectangle([x, y, x + grid_width, y + grid_height], 
                          fill=(20, 25, 32), outline=t['border'], width=2)
            
            # 模拟视频内容 - 渐变效果
            for i in range(grid_height):
                gray = 25 + int(10 * math.sin(i * 0.05))
                draw.line([(x, y + i), (x + grid_width, y + i)], 
                         fill=(gray, gray + 5, gray + 10))
            
            # 视频标题栏
            draw.rectangle([x, y, x + grid_width, y + 36], fill=(0, 0, 0, 128))
            draw.text((x + 12, y + 10), f"摄像头-0{row*2+col+1}", fill=t['text_primary'], font=fonts['small'])
            
            # 在线指示
            draw.ellipse([x + grid_width - 50, y + 12, x + grid_width - 38, y + 24], fill=t['success'])
            draw.text((x + grid_width - 32, y + 10), "LIVE", fill=t['success'], font=fonts['small'])
            
            # YOLO检测框模拟
            if row == 0 and col == 0:
                # 模拟检测到物体
                box_x, box_y = x + 150, y + 100
                draw.rectangle([box_x, box_y, box_x + 120, box_y + 80], 
                              outline=t['warning'], width=2)
                draw.rectangle([box_x, box_y - 20, box_x + 80, box_y], fill=t['warning'])
                draw.text((box_x + 8, box_y - 16), "person: 94%", fill=t['bg_primary'], font=fonts['small'])
    
    # OpenClaw悬浮按钮
    btn_x, btn_y = content_x + 40, height - 100
    draw.ellipse([btn_x, btn_y, btn_x + 56, btn_y + 56], fill=t['bg_secondary'], outline=t['accent'], width=2)
    draw.ellipse([btn_x + 20, btn_y + 20, btn_x + 36, btn_y + 36], fill=t['accent'])
    
    img.save(f"{OUTPUT_DIR}/monitor_interface.png", "PNG")
    return "monitor_interface.png"

def create_media_library():
    """创建媒体库界面 - 专业文件管理风格"""
    width, height = 1920, 1080
    t = DEEP_THEME
    fonts = get_fonts()
    
    img = Image.new('RGB', (width, height), t['bg_primary'])
    draw = ImageDraw.Draw(img)
    
    nav_width = 72
    sidebar_width = 280
    
    # 左侧导航
    draw.rectangle([0, 0, nav_width, height], fill=t['bg_secondary'])
    
    # Logo
    logo_size = 48
    logo_x = (nav_width - logo_size) // 2
    draw.ellipse([logo_x, 20, logo_x + logo_size, 20 + logo_size], outline=t['text_primary'], width=2)
    
    # 激活的媒体库图标
    draw.rectangle([8, 236, nav_width - 8, 292], fill=t['bg_tertiary'], outline=t['accent'], width=2)
    draw.rectangle([0, 244, 3, 284], fill=t['accent'])
    
    # 文件夹树面板
    draw.rectangle([nav_width, 0, nav_width + sidebar_width, height], fill=t['bg_secondary'], outline=t['border'])
    
    # 标题
    draw.text((nav_width + 20, 20), "媒体库", fill=t['text_primary'], font=fonts['title'])
    
    # 新建文件夹按钮
    draw.rectangle([nav_width + 20, 60, nav_width + sidebar_width - 20, 100], 
                  fill=t['accent'], outline=t['accent'])
    draw.text((nav_width + 80, 70), "新建文件夹", fill=t['bg_primary'], font=fonts['text'])
    
    # 文件夹树
    folders = [
        ("▼ 无人机巡检", 0, True),
        ("   2024年3月", 1, False),
        ("   2024年4月", 1, False),
        ("▶ 工业监测", 0, False),
        ("▶ 公共资料", 0, False),
    ]
    
    y = 120
    for name, level, is_selected in folders:
        if is_selected:
            draw.rectangle([nav_width + 12, y, nav_width + sidebar_width - 12, y + 40], 
                          fill=t['accent'])
            draw.text((nav_width + 20 + level * 16, y + 10), name, fill=t['bg_primary'], font=fonts['text'])
        else:
            draw.text((nav_width + 20 + level * 16, y + 10), name, fill=t['text_primary'], font=fonts['text'])
        y += 48
    
    # 存储统计
    draw.rectangle([nav_width + 20, height - 120, nav_width + sidebar_width - 20, height - 20], 
                  fill=t['bg_tertiary'], outline=t['border'])
    draw.text((nav_width + 30, height - 105), "存储使用", fill=t['text_secondary'], font=fonts['small'])
    draw.text((nav_width + sidebar_width - 70, height - 105), "75%", fill=t['text_primary'], font=fonts['text'])
    
    # 进度条
    draw.rectangle([nav_width + 30, height - 70, nav_width + sidebar_width - 30, height - 55], 
                  fill=t['bg_secondary'], outline=t['border'])
    bar_width = (sidebar_width - 80) * 0.75
    draw.rectangle([nav_width + 30, height - 70, nav_width + 30 + int(bar_width), height - 55], 
                  fill=t['accent'])
    
    draw.text((nav_width + 30, height - 45), "已使用 75 GB / 100 GB", fill=t['text_secondary'], font=fonts['small'])
    
    # 主内容区
    content_x = nav_width + sidebar_width
    
    # 顶部工具栏
    draw.rectangle([content_x, 0, width, 72], fill=t['bg_secondary'], outline=t['border'])
    
    # 面包屑
    draw.text((content_x + 24, 24), "🏠 / 无人机巡检 / 2024年3月", fill=t['text_secondary'], font=fonts['text'])
    
    # 搜索框
    search_x = width - 500
    draw.rectangle([search_x, 16, search_x + 200, 56], fill=t['bg_primary'], outline=t['border'])
    draw.text((search_x + 12, 26), "🔍 搜索文件...", fill=t['text_tertiary'], font=fonts['small'])
    
    # 视图切换
    draw.rectangle([width - 120, 16, width - 70, 56], fill=t['accent'])
    draw.text((width - 105, 26), "网格", fill=t['bg_primary'], font=fonts['small'])
    draw.rectangle([width - 70, 16, width - 20, 56], outline=t['border'])
    draw.text((width - 55, 26), "列表", fill=t['text_secondary'], font=fonts['small'])
    
    # 上传按钮
    draw.rectangle([width - 280, 16, width - 140, 56], fill=t['success'])
    draw.text((width - 240, 26), "⬆️ 上传文件", fill=t['bg_primary'], font=fonts['small'])
    
    # 文件网格
    grid_y = 100
    card_width = 200
    card_height = 240
    gap = 24
    
    files = [
        ("DJI_001.jpg", "2.4 MB", "图片"),
        ("DJI_002.jpg", "2.1 MB", "图片"),
        ("flight_01.mp4", "45.2 MB", "视频"),
        ("DJI_003.jpg", "2.8 MB", "图片"),
        ("report.pdf", "1.2 MB", "文档"),
        ("DJI_004.jpg", "2.3 MB", "图片"),
        ("analysis.zip", "15.6 MB", "压缩包"),
        ("DJI_005.jpg", "2.5 MB", "图片"),
    ]
    
    cols = 6
    for i, (filename, size, ftype) in enumerate(files):
        col = i % cols
        row = i // cols
        x = content_x + 24 + col * (card_width + gap)
        y = grid_y + row * (card_height + gap)
        
        # 卡片背景
        draw.rectangle([x, y, x + card_width, y + card_height], 
                      fill=t['bg_secondary'], outline=t['border'])
        
        # 缩略图区域
        thumb_height = 160
        draw.rectangle([x, y, x + card_width, y + thumb_height], fill=(35, 40, 48))
        
        # 模拟图片内容
        if ftype == "图片":
            for j in range(thumb_height):
                gray = 40 + int(15 * math.sin((j + i * 30) * 0.1))
                draw.line([(x, y + j), (x + card_width, y + j)], fill=(gray, gray + 10, gray + 20))
        elif ftype == "视频":
            draw.rectangle([x, y, x + card_width, y + thumb_height], fill=(45, 50, 58))
            # 播放图标
            cx, cy = x + card_width // 2, y + thumb_height // 2
            draw.polygon([(cx - 15, cy - 20), (cx + 20, cy), (cx - 15, cy + 20)], fill=t['text_secondary'])
        
        # 文件类型标签
        type_colors = {"图片": t['accent'], "视频": t['error'], "文档": t['warning'], "压缩包": t['text_secondary']}
        draw.rectangle([x + 8, y + 8, x + 60, y + 28], fill=type_colors.get(ftype, t['text_secondary']))
        draw.text((x + 14, y + 12), ftype, fill=t['bg_primary'], font=fonts['small'])
        
        # 文件名
        draw.text((x + 12, y + thumb_height + 12), filename, fill=t['text_primary'], font=fonts['text'])
        draw.text((x + 12, y + thumb_height + 36), size, fill=t['text_secondary'], font=fonts['small'])
        
        # 更多操作按钮
        draw.rectangle([x + card_width - 32, y + thumb_height + 12, x + card_width - 8, y + thumb_height + 36], 
                      outline=t['border'])
        draw.text((x + card_width - 24, y + thumb_height + 16), "⋮", fill=t['text_secondary'], font=fonts['text'])
    
    img.save(f"{OUTPUT_DIR}/media_library.png", "PNG")
    return "media_library.png"

def create_openclaw_panel():
    """创建OpenClaw AI助手界面设计"""
    width, height = 480, 720
    t = DEEP_THEME
    fonts = get_fonts()
    
    img = Image.new('RGB', (width, height), t['bg_secondary'])
    draw = ImageDraw.Draw(img)
    
    # 顶部标题栏
    draw.rectangle([0, 0, width, 64], fill=t['bg_tertiary'], outline=t['border'])
    
    # AI图标
    draw.ellipse([16, 16, 48, 48], fill=t['accent'])
    draw.text((24, 24), "AI", fill=t['bg_primary'], font=fonts['small'])
    
    draw.text((64, 20), "OpenClaw 助手", fill=t['text_primary'], font=fonts['subtitle'])
    draw.text((64, 42), "基于巡检宝AI技术", fill=t['text_secondary'], font=fonts['small'])
    
    # 关闭按钮
    draw.text((width - 40, 20), "✕", fill=t['text_secondary'], font=fonts['subtitle'])
    
    # 聊天内容区
    chat_y = 80
    
    # AI欢迎消息
    draw_rounded_rect(draw, [16, chat_y, width - 16, chat_y + 80], radius=12, 
                     fill=t['bg_tertiary'], outline=t['border'])
    draw.text((32, chat_y + 16), "你好！我是巡检宝AI助手。", fill=t['text_primary'], font=fonts['text'])
    draw.text((32, chat_y + 42), "我可以帮你分析监控数据、识别", fill=t['text_secondary'], font=fonts['small'])
    draw.text((32, chat_y + 60), "异常行为、生成报告等。", fill=t['text_secondary'], font=fonts['small'])
    
    chat_y += 100
    
    # 快捷操作
    draw.text((16, chat_y), "快捷操作", fill=t['text_secondary'], font=fonts['small'])
    chat_y += 30
    
    actions = [
        "✨ 分析今日告警",
        "📊 生成巡检报告", 
        "🎯 识别异常行为",
        "📈 查看趋势分析"
    ]
    
    for action in actions:
        draw_rounded_rect(draw, [16, chat_y, width - 16, chat_y + 44], radius=8,
                         fill=t['bg_primary'], outline=t['border'])
        draw.text((32, chat_y + 12), action, fill=t['text_primary'], font=fonts['text'])
        chat_y += 56
    
    # 输入框
    input_y = height - 80
    draw_rounded_rect(draw, [16, input_y, width - 80, input_y + 48], radius=8,
                     fill=t['bg_primary'], outline=t['border'])
    draw.text((32, input_y + 14), "输入你的问题...", fill=t['text_tertiary'], font=fonts['text'])
    
    # 发送按钮
    draw.ellipse([width - 64, input_y, width - 16, input_y + 48], fill=t['accent'])
    draw.text((width - 48, input_y + 14), "➤", fill=t['bg_primary'], font=fonts['text'])
    
    img.save(f"{OUTPUT_DIR}/openclaw_panel.png", "PNG")
    return "openclaw_panel.png"

def create_design_system_doc():
    """创建设计规范文档图片"""
    width, height = 1920, 1400
    t = DEEP_THEME
    fonts = get_fonts()
    
    img = Image.new('RGB', (width, height), (250, 250, 250))
    draw = ImageDraw.Draw(img)
    
    # 标题
    draw.text((80, 60), "巡检宝设计系统 v2.0", fill=(30, 30, 30), font=fonts['large_num'])
    draw.text((80, 130), "Precision Order · 精密秩序", fill=(100, 100, 100), font=fonts['subtitle'])
    
    # 三档主题展示
    section_y = 220
    draw.text((80, section_y), "三档明暗灰度主题", fill=(30, 30, 30), font=fonts['title'])
    
    themes = [
        ("深境模式 (Deep)", "#0D1117", "#161B22", "#30363D", "#E6EDF3", (13, 17, 23)),
        ("均衡模式 (Balanced)", "#1E2228", "#2A3038", "#3D444D", "#E8EDF2", (30, 34, 40)),
        ("清境模式 (Clear)", "#F5F7FA", "#FFFFFF", "#DDE2E8", "#1F2328", (245, 247, 250)),
    ]
    
    x = 80
    for name, c1, c2, c3, text, bg in themes:
        # 主题卡片
        draw.rectangle([x, section_y + 50, x + 560, section_y + 350], fill=bg, outline=(200, 200, 200), width=2)
        
        # 主题名称
        text_color = (230, 237, 243) if bg[0] < 100 else (30, 35, 42)
        draw.text((x + 20, section_y + 70), name, fill=text_color, font=fonts['subtitle'])
        
        # 色块展示
        colors = [c1, c2, c3, text]
        color_names = ["主背景", "次背景", "边框", "主文字"]
        
        cy = section_y + 120
        for color, cname in zip(colors, color_names):
            # 解析颜色
            r = int(color[1:3], 16)
            g = int(color[3:5], 16)
            b = int(color[5:7], 16)
            
            draw.rectangle([x + 20, cy, x + 60, cy + 40], fill=(r, g, b), outline=(180, 180, 180))
            draw.text((x + 75, cy + 10), f"{cname}", fill=text_color, font=fonts['small'])
            draw.text((x + 150, cy + 10), color, fill=(150, 150, 150), font=fonts['small'])
            cy += 55
        
        x += 600
    
    # 功能色彩
    section_y = 620
    draw.text((80, section_y), "功能色彩系统", fill=(30, 30, 30), font=fonts['title'])
    
    func_colors = [
        ("强调色 (Accent)", "#58A6FF", (88, 166, 255), "AI功能、链接、按钮"),
        ("成功 (Success)", "#3FB950", (63, 185, 80), "在线、正常、完成"),
        ("警告 (Warning)", "#D29922", (210, 153, 34), "告警、注意、待处理"),
        ("错误 (Error)", "#F85149", (248, 81, 73), "离线、危险、紧急"),
    ]
    
    x = 80
    for name, hex_code, rgb, usage in func_colors:
        draw.rectangle([x, section_y + 50, x + 440, section_y + 180], fill=(255, 255, 255), outline=(220, 220, 220), width=2)
        
        # 色块
        draw.rectangle([x + 20, section_y + 70, x + 100, section_y + 150], fill=rgb, outline=(200, 200, 200))
        
        draw.text((x + 120, section_y + 80), name, fill=(50, 50, 50), font=fonts['text'])
        draw.text((x + 120, section_y + 105), hex_code, fill=(100, 100, 100), font=fonts['small'])
        draw.text((x + 120, section_y + 130), usage, fill=(150, 150, 150), font=fonts['small'])
        
        x += 470
    
    # 字体规范
    section_y = 850
    draw.text((80, section_y), "字体规范", fill=(30, 30, 30), font=fonts['title'])
    
    font_specs = [
        ("标题 (Title)", "24px / Bold", "监控大屏"),
        ("副标题 (Subtitle)", "18px / Semibold", "设备状态概览"),
        ("正文 (Text)", "14px / Regular", "在线 21 / 离线 3"),
        ("小字 (Small)", "12px / Regular", "2分钟前"),
        ("数字 (Number)", "32px / Medium", "24"),
    ]
    
    y = section_y + 60
    for label, spec, example in font_specs:
        draw.text((80, y), label, fill=(50, 50, 50), font=fonts['text'])
        draw.text((280, y), spec, fill=(100, 100, 100), font=fonts['small'])
        draw.text((500, y), example, fill=(30, 30, 30), font=fonts['text'])
        y += 45
    
    # 间距规范
    section_y = 1120
    draw.text((80, section_y), "间距规范 (8px基准网格)", fill=(30, 30, 30), font=fonts['title'])
    
    spacing_specs = [
        ("xs", "4px", "图标内边距"),
        ("sm", "8px", "紧凑间距"),
        ("md", "16px", "卡片内边距"),
        ("lg", "24px", "区块间距"),
        ("xl", "32px", "大模块间距"),
    ]
    
    x = 80
    for size, px, usage in spacing_specs:
        w = int(px.replace("px", "")) * 3
        draw.rectangle([x, section_y + 60, x + w, section_y + 100], fill=(88, 166, 255), outline=(60, 130, 220))
        draw.text((x, section_y + 110), f"{size} = {px}", fill=(50, 50, 50), font=fonts['small'])
        draw.text((x, section_y + 135), usage, fill=(150, 150, 150), font=fonts['small'])
        x += 120
    
    # Logo使用规范
    section_y = 1280
    draw.text((80, section_y), "Logo使用规范", fill=(30, 30, 30), font=fonts['title'])
    
    # 绘制Logo示例
    logo_y = section_y + 50
    # 白底黑线
    draw.rectangle([80, logo_y, 200, logo_y + 100], fill=(255, 255, 255), outline=(200, 200, 200))
    draw.ellipse([100, logo_y + 20, 180, logo_y + 80], outline=(0, 0, 0), width=2)
    draw.ellipse([125, logo_y + 40, 155, logo_y + 60], outline=(0, 0, 0), width=2)
    draw.text((100, logo_y + 110), "白底黑线", fill=(100, 100, 100), font=fonts['small'])
    
    # 深色背景
    draw.rectangle([240, logo_y, 360, logo_y + 100], fill=(13, 17, 23), outline=(200, 200, 200))
    draw.ellipse([260, logo_y + 20, 340, logo_y + 80], outline=(255, 255, 255), width=2)
    draw.ellipse([285, logo_y + 40, 315, logo_y + 60], outline=(255, 255, 255), width=2)
    draw.text((260, logo_y + 110), "深色背景", fill=(100, 100, 100), font=fonts['small'])
    
    img.save(f"{OUTPUT_DIR}/design_system.png", "PNG")
    return "design_system.png"

def main():
    print("🎨 生成巡检宝核心界面设计...")
    print("=" * 50)
    
    print("\n📹 生成视频监控界面...")
    monitor_file = create_monitor_interface()
    print(f"   ✓ {monitor_file}")
    
    print("\n📁 生成媒体库界面...")
    media_file = create_media_library()
    print(f"   ✓ {media_file}")
    
    print("\n🤖 生成OpenClaw AI助手界面...")
    openclaw_file = create_openclaw_panel()
    print(f"   ✓ {openclaw_file}")
    
    print("\n📐 生成设计规范文档...")
    design_file = create_design_system_doc()
    print(f"   ✓ {design_file}")
    
    print("\n" + "=" * 50)
    print(f"✅ 所有UI设计文件已保存到: {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
