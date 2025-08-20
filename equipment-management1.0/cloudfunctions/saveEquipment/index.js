// 云函数：保存单条器材数据
const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
  const { equipment } = event;

  // 校验必填字段
  if (!equipment || !equipment.id || !equipment.name) {
    return {
      success: false,
      code: 400,
      message: '缺少必要字段（编号或名称）'
    };
  }

  try {
    // 检查是否已存在
    const queryResult = await db.collection('equipment')
      .where({ id: equipment.id })
      .get();

    if (queryResult.data && queryResult.data.length > 0) {
      // 更新已有数据
      await db.collection('equipment')
        .where({ id: equipment.id })
        .update({ data: equipment });
      
      return {
        success: true,
        code: 200,
        message: '数据更新成功'
      };
    } else {
      // 添加新数据
      await db.collection('equipment').add({ data: equipment });
      
      return {
        success: true,
        code: 201,
        message: '数据添加成功'
      };
    }
  } catch (err) {
    console.error('云端保存失败:', err);
    return {
      success: false,
      code: 500,
      message: `同步失败：${err.message}`, // 返回具体错误信息
      error: err.message
    };
  }
};