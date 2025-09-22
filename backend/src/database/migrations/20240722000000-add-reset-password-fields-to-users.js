import { DataTypes } from 'sequelize';

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  const transaction = await queryInterface.sequelize.transaction();
  try {
    const tableDescription = await queryInterface.describeTable('Users', { transaction });

    if (!tableDescription.resetPasswordToken) {
      await queryInterface.addColumn('Users', 'resetPasswordToken', {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      }, { transaction });
    }

    if (!tableDescription.resetPasswordExpires) {
      await queryInterface.addColumn('Users', 'resetPasswordExpires', {
        type: DataTypes.DATE,
        allowNull: true,
      }, { transaction });
    }
    
    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

export async function down(queryInterface, Sequelize) {
  const transaction = await queryInterface.sequelize.transaction();
  try {
    const tableDescription = await queryInterface.describeTable('Users', { transaction });

    if (tableDescription.resetPasswordToken) {
      await queryInterface.removeColumn('Users', 'resetPasswordToken', { transaction });
    }
    
    if (tableDescription.resetPasswordExpires) {
      await queryInterface.removeColumn('Users', 'resetPasswordExpires', { transaction });
    }
    
    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}
