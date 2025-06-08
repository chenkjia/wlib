function getSmallerOrderValue(num) {
  if (num === 0) return 0;
  
  const absNum = Math.abs(num);
  
  // 处理整数部分 >=1 的情况
  if (absNum >= 1) {
    // 获取最高位的数量级
    const magnitude = Math.floor(Math.log10(absNum));
    return Math.pow(10, magnitude);
  }
  
  // 处理纯小数的情况（整数部分为 0）
  else {
    // 转换为科学计数法字符串（如 0.001 → "1e-3"）
    const scientificStr = absNum.toExponential();
    // 提取指数部分（如 "1e-3" → -3）
    const exponent = parseInt(scientificStr.split('e')[1]);
    // 计算小一位的值（如 -3 → 10^(-4) = 0.0001）
    return Math.pow(10, exponent - 1);
  }
}

export {
  getSmallerOrderValue
};