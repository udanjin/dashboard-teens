  import { DataTypes, Model } from 'sequelize';
  import sequelize from '../config/db';

  class User extends Model {
    public id!: number;
    public username!: string;
    public password!: string;
    public role! : string | null;
    public status! : 'pending' | 'approved' | 'rejected'
  }

  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,  // Ensure unique username
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role:{
        type: DataTypes.STRING,
        allowNull: true,
      },
      status:{
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        allowNull:false,
        defaultValue:"pending"
      }
    },
    {
      sequelize,
      tableName: 'users',
    }
  );

  export default User;
