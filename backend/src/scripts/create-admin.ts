// src/scripts/create-admin.ts
import { createConnection } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { hashPassword } from '../auth/utils/password.utils';
import { UserRole } from '../user/entities/user.entity'; // ✅ Importar el enum

async function createAdminUser() {
  try {
    console.log('🔧 Creando usuario admin...');
    
    // Crear conexión a base de datos
    const connection = await createConnection();
    
    // Verificar si ya existe un usuario admin
    const existingAdmin = await connection.getRepository(User).findOne({
      where: { legajo: '00001' }
    });
    
    if (existingAdmin) {
      console.log('✅ Usuario admin ya existe');
      console.log('📧 Email:', existingAdmin.email);
      console.log('🔒 Legajo:', existingAdmin.legajo);
      console.log('👤 Nombre:', existingAdmin.nombre, existingAdmin.apellido);
      await connection.close();
      return;
    }
    
    // Crear usuario admin
    const adminUser = new User();
    adminUser.nombre = 'Administrador';
    adminUser.apellido = 'Sistema';
    adminUser.email = 'admin@universidad.edu.ar';
    adminUser.legajo = '00001';
    adminUser.dni = '99999999';
    adminUser.password = await hashPassword('99999999'); // Contraseña por defecto: DNI
    adminUser.rol = UserRole.ADMIN; // ✅ Usar el enum en lugar de cadena literal
    
    await connection.getRepository(User).save(adminUser);
    console.log('✅ Usuario admin creado exitosamente');
    console.log('📧 Email: admin@universidad.edu.ar');
    console.log('🔒 Legajo: 00001');
    console.log('🔑 Contraseña por defecto: 99999999 (DNI)');
    console.log('⚠️  Por favor cambia la contraseña inmediatamente después del primer login');
    
    await connection.close();
  } catch (error) {
    console.error('❌ Error creando usuario admin:', error);
    process.exit(1);
  }
}

createAdminUser();