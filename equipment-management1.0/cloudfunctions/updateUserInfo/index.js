// 云函数入口文件
const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    // 构建更新数据对象
    const updateData = {
      updatedAt: new Date(),
      ...event // 合并传入的更新字段（username, phone, email等）
    };
    
    // 移除不必要的字段
    delete updateData.id;
    
    // 更新用户信息
    await db.collection('users').where({
      openid: openid
    }).update({
      data: updateData
    });

    // 返回更新后的用户信息
    const userResult = await db.collection('users').where({ openid }).get();
    
    if (userResult.data.length > 0) {
      return {
        code: 0,
        success: true,
        message: '信息更新成功',
        userInfo: { ...userResult.data[0], id: userResult.data[0]._id }
      };
    } else {
      return {
        code: 1,
        success: false,
        message: '未找到用户'
      };
    }
  } catch (err) {
    console.error('更新用户信息失败', err);
    return { 
      code: 1,
      success: false,
      message: '更新失败',
      error: err.message 
    };
  }
};
