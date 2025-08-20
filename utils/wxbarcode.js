/**
 * 微信小程序条码生成工具
 * 支持Code128格式
 */
const wxbarcode = {
  code128: function(canvasId, code, width, height) {
    if (!code) return;
    
    const ctx = wx.createCanvasContext(canvasId);
    ctx.setFillStyle('#ffffff');
    ctx.fillRect(0, 0, width, height);
    
    // Code128编码逻辑
    const codeArray = this.code128Encode(code);
    if (!codeArray) return;
    
    // 计算条码宽度
    const barWidth = width / (codeArray.length + 10); // 左右留白
    const barHeight = height * 0.7; // 条码高度
    
    // 绘制条码
    let x = barWidth * 5; // 左留白
    codeArray.forEach(bit => {
      if (bit) {
        ctx.setFillStyle('#000000');
        ctx.fillRect(x, height * 0.1, barWidth, barHeight);
      }
      x += barWidth;
    });
    
    // 绘制文字
    ctx.setFillStyle('#000000');
    ctx.setFontSize(14);
    const textWidth = ctx.measureText(code).width;
    ctx.fillText(code, width / 2 - textWidth / 2, height * 0.9);
    
    ctx.draw();
  },
  
  // Code128编码实现
  code128Encode: function(code) {
    // 简化版Code128编码实现
    const code128B = [
      0x2122,0x2221,0x2241,0x2421,0x4221,0x2142,0x2441,0x4241,0x4421,0x2124,
      0x2224,0x2244,0x2424,0x4224,0x4422,0x2144,0x2444,0x4244,0x4424,0x4442,
      0x2126,0x2226,0x2246,0x2426,0x4226,0x4426,0x2146,0x2446,0x4246,0x4426,
      0x4446,0x2162,0x2262,0x2264,0x2462,0x4262,0x4462,0x2164,0x2464,0x4264,
      0x4464,0x4466,0x2166,0x2466,0x4266,0x4466,0x6221,0x6241,0x6421,0x6441,
      0x2621,0x4621,0x4641,0x2641,0x2622,0x2624,0x2642,0x4622,0x4624,0x4642,
      0x2644,0x4644,0x6222,0x6224,0x6242,0x6244,0x6422,0x6424,0x6442,0x6444,
      0x2266,0x2466,0x2626,0x2646,0x2662,0x2664,0x2666,0x4266,0x4626,0x4646,
      0x4662,0x4664,0x4666,0x6262,0x6264,0x6266,0x6462,0x6464,0x6466,0x6622,
      0x6624,0x6626,0x6642,0x6644,0x6646,0x6662,0x6664,0x6666,0x2181,0x2183
    ];
    
    // 计算校验和
    let checkSum = 104; // Code128B起始码
    let codeArray = [104]; // 起始码
    
    for (let i = 0; i < code.length; i++) {
      const charCode = code.charCodeAt(i) - 32;
      codeArray.push(charCode);
      checkSum += (i + 1) * charCode;
    }
    
    checkSum %= 103;
    codeArray.push(checkSum);
    codeArray.push(106); // 结束码
    
    // 转换为条码像素数组
    let result = [];
    codeArray.forEach(code => {
      let bits = code128B[code];
      for (let i = 0; i < 4; i++) {
        const part = (bits >> (2 * (3 - i))) & 0x03;
        for (let j = 0; j < part; j++) {
          result.push(i % 2 === 0 ? 1 : 0);
        }
      }
    });
    
    return result;
  }
};

module.exports = wxbarcode;
