// 云函数：获取所有器材数据（供本地同步使用）
const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    // 查询所有器材数据
    const result = await db.collection('equipment').get();
    
    return {
      success: true,
      data: result.data || [],
      message: '数据获取成功'
    };
  } catch (err) {
    console.error('获取云端数据失败:', err);
    return {
      success: false,
      message: '获取云端数据失败',
      error: err.message
    };
  }
};