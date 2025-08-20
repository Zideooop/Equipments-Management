// 云函数入口文件
const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    // 查找用户是否已存在
    let userResult = await db.collection('users').where({
      openid: openid
    }).get();

    if (userResult.data.length === 0) {
      // 新用户，创建记录
      const newUser = {
        openid: openid,
        username: '用户' + Math.random().toString(36).substr(2, 6),
        avatar: '',
        phone: '',
        email: '',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const addResult = await db.collection('users').add({ 
        data: newUser 
      });
      
      return { 
        code: 0,
        message: '新用户创建成功',
        userInfo: { ...newUser, id: addResult._id }
      };
    } else {
      // 老用户，返回信息
      return { 
        code: 0,
        message: '登录成功',
        userInfo: { ...userResult.data[0], id: userResult.data[0]._id }
      };
    }
  } catch (err) {
    console.error('登录云函数错误', err);
    return { 
      code: 1,
      message: '登录失败',
      error: err.message 
    };
  }
};
