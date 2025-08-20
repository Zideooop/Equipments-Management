// cloudfunctions/batchSaveEquipment/index.js
const cloud = require('wx-server-sdk');

cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const { equipmentList } = event;
    
    if (!equipmentList || !Array.isArray(equipmentList) || equipmentList.length === 0) {
      return {
        success: false,
        message: '没有有效数据'
      };
    }

    // 批量添加或更新数据
    const batchResult = await Promise.all(
      equipmentList.map(equipment => 
        db.collection('equipment').where({ id: equipment.id })
          .count()
          .then(res => {
            if (res.total > 0) {
              // 更新已有数据
              return db.collection('equipment').where({ id: equipment.id })
                .update({ data: equipment });
            } else {
              // 添加新数据
              return db.collection('equipment').add({ data: equipment });
            }
          })
      )
    );

    return {
      success: true,
      result: batchResult
    };
  } catch (err) {
    console.error('批量保存失败:', err);
    return {
      success: false,
      message: err.message
    };
  }
};