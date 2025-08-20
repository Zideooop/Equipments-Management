/**
 * QR Code 生成器核心实现
 * 参考QR Code规范：ISO/IEC 18004
 */
const QRCode = {
  // 纠错级别：L(7%) < M(15%) < Q(25%) < H(30%)
  ERROR_CORRECTION: {
    L: 0,
    M: 1,
    Q: 2,
    H: 3
  },
  
  // 生成QR Code
  createQrCode: function(canvasId, text, size = 400, errorLevel = 'M') {
    if (!text || text.trim() === '') return;
    
    // 1. 确定版本（根据内容长度和纠错级别自动选择）
    const errorCorrectionLevel = this.ERROR_CORRECTION[errorLevel] || this.ERROR_CORRECTION.M;
    const version = this.determineVersion(text, errorCorrectionLevel);
    if (!version) {
      console.error('内容过长，无法生成二维码');
      return;
    }
    
    // 2. 编码数据
    const encodedData = this.encodeData(text, version, errorCorrectionLevel);
    
    // 3. 生成数据矩阵
    const qrMatrix = this.createMatrix(encodedData, version, errorCorrectionLevel);
    
    // 4. 绘制二维码
    this.drawQrCode(canvasId, qrMatrix, size);
  },
  
  // 确定QR Code版本（1-40，尺寸逐渐增大）
  determineVersion: function(text, errorLevel) {
    // 简化版：根据文本长度估算版本（完整实现需参考QR码规范）
    const textLength = text.length;
    // 不同纠错级别下各版本支持的最大字符数（数字）
    const capacity = [
      [41, 34, 27, 17], [77, 63, 48, 32], [127, 101, 77, 53],
      [187, 149, 114, 78], [255, 202, 154, 106], [322, 255, 192, 134]
    ];
    
    for (let version = 1; version <= capacity.length; version++) {
      if (textLength <= capacity[version - 1][errorLevel]) {
        return version;
      }
    }
    return 6; // 超过基础版本使用版本6
  },
  
  // 数据编码（简化实现，完整实现需支持多种模式）
  encodeData: function(text, version, errorLevel) {
    // 此处简化为数字模式编码，完整实现需支持字母、汉字等
    let data = [];
    for (let i = 0; i < text.length; i++) {
      data.push(text.charCodeAt(i));
    }
    return data;
  },
  
  // 创建QR码矩阵（包含定位图案、时序图案和数据）
  createMatrix: function(data, version, errorLevel) {
    // 版本决定尺寸：size = 4*version + 9
    const size = 4 * version + 9;
    const matrix = Array.from({ length: size }, () => Array(size).fill(0));
    
    // 1. 绘制定位图案（三个角的正方形）
    this.drawPositionDetectionPatterns(matrix, size);
    
    // 2. 绘制时序图案（水平和垂直的交替线条）
    this.drawAlignmentPatterns(matrix, size, version);
    
    // 3. 绘制格式信息（纠错级别和掩码模式）
    this.drawFormatInfo(matrix, size, errorLevel);
    
    // 4. 填充数据（简化实现）
    this.fillData(matrix, size, data);
    
    return matrix;
  },
  
  // 绘制定位图案（QR码三个角的标志性方块）
  drawPositionDetectionPatterns: function(matrix, size) {
    const drawPattern = (x, y) => {
      // 外框
      for (let i = -3; i <= 3; i++) {
        for (let j = -3; j <= 3; j++) {
          if (Math.abs(i) === 3 || Math.abs(j) === 3) {
            matrix[y + i][x + j] = 1;
          }
        }
      }
      // 内框
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          matrix[y + i][x + j] = 1;
        }
      }
      // 中间空白
      matrix[y][x] = 0;
    };
    
    // 三个角的定位图案
    drawPattern(3, 3);
    drawPattern(size - 4, 3);
    drawPattern(3, size - 4);
  },
  
  // 绘制时序图案（交替的黑白线）
  drawAlignmentPatterns: function(matrix, size, version) {
    // 水平时序图案
    for (let x = 8; x < size - 8; x++) {
      const y = 6;
      matrix[y][x] = (x % 2 === 0) ? 1 : 0;
    }
    
    // 垂直时序图案
    for (let y = 8; y < size - 8; y++) {
      const x = 6;
      matrix[y][x] = (y % 2 === 0) ? 1 : 0;
    }
  },
  
  // 绘制格式信息
  drawFormatInfo: function(matrix, size, errorLevel) {
    // 简化实现：实际需要根据纠错级别生成特定二进制序列
    const formatData = [1,0,1,0,1,0,0,0,0,0,1,0,0,1,0];
    
    // 顶部格式信息
    for (let i = 0; i < 15; i++) {
      if (i < 7) {
        matrix[8][i] = formatData[i];
      } else {
        matrix[8][i + 1] = formatData[i];
      }
    }
    
    // 右侧格式信息
    for (let i = 0; i < 15; i++) {
      if (i < 8) {
        matrix[i][8] = formatData[i];
      } else {
        matrix[i + 1][8] = formatData[i];
      }
    }
  },
  
  // 填充数据到矩阵
  fillData: function(matrix, size, data) {
    let x = size - 1;
    let y = size - 1;
    let direction = -1;
    let index = 0;
    
    // 跳过定位图案区域，从右下角开始填充
    while (x > 0) {
      if (x === 6) x--; // 避开时序图案
      
      // 填充当前列（上下各一次）
      for (let i = 0; i < 2; i++) {
        if (y < size && y >= 0 && matrix[y][x] === 0) {
          // 填充数据（循环使用）
          matrix[y][x] = data[index % data.length] % 2;
          index++;
        }
        y += direction;
      }
      
      direction *= -1;
      x--;
    }
  },
  
  // 绘制二维码到画布
  drawQrCode: function(canvasId, matrix, size) {
    const ctx = wx.createCanvasContext(canvasId);
    const moduleSize = size / matrix.length; // 每个模块的大小
    
    // 白色背景
    ctx.setFillStyle('#ffffff');
    ctx.fillRect(0, 0, size, size);
    
    // 绘制二维码模块（黑色）
    ctx.setFillStyle('#000000');
    for (let y = 0; y < matrix.length; y++) {
      for (let x = 0; x < matrix.length; x++) {
        if (matrix[y][x] === 1) {
          // 绘制每个模块，确保边缘清晰
          ctx.fillRect(
            Math.round(x * moduleSize),
            Math.round(y * moduleSize),
            Math.ceil(moduleSize),
            Math.ceil(moduleSize)
          );
        }
      }
    }
    
    ctx.draw();
  }
};

module.exports = QRCode;
