// 云函数：获取器材列表
const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const result = await db.collection('equipment').get();
    return {
      success: true,
      code: 200,
      data: result.data,
      message: '获取成功'
    };
  } catch (err) {
    console.error('获取器材列表失败:', err);
    return {
      success: false,
      code: 500,
      message: `获取失败：${err.message}`,
      error: err.message
    };
  }
};