-- Activar RLS en las tablas principales
ALTER TABLE usuario                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE cliente                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE domicilio               ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspeccion              ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacion            ENABLE ROW LEVEL SECURITY;
ALTER TABLE trayecto                ENABLE ROW LEVEL SECURITY;
ALTER TABLE punto_ubicacion         ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultado_inspeccion    ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensaje                 ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- POLÍTICAS GENERALES (ADMINISTRADOR)
-- El administrador tiene acceso total a todo
-- ==========================================
CREATE POLICY p_admin_ve_todo_inspeccion ON inspeccion FOR ALL USING (EXISTS (SELECT 1 FROM usuario u JOIN rol r ON r.id_rol = u.id_rol WHERE u.auth_uid = auth.uid() AND r.nombre = 'ADMINISTRADOR'));
CREATE POLICY p_admin_ve_todo_usuario ON usuario FOR ALL USING (EXISTS (SELECT 1 FROM usuario u JOIN rol r ON r.id_rol = u.id_rol WHERE u.auth_uid = auth.uid() AND r.nombre = 'ADMINISTRADOR'));
CREATE POLICY p_admin_ve_todo_cliente ON cliente FOR ALL USING (EXISTS (SELECT 1 FROM usuario u JOIN rol r ON r.id_rol = u.id_rol WHERE u.auth_uid = auth.uid() AND r.nombre = 'ADMINISTRADOR'));
CREATE POLICY p_admin_ve_todo_domicilio ON domicilio FOR ALL USING (EXISTS (SELECT 1 FROM usuario u JOIN rol r ON r.id_rol = u.id_rol WHERE u.auth_uid = auth.uid() AND r.nombre = 'ADMINISTRADOR'));
CREATE POLICY p_admin_ve_todo_notificacion ON notificacion FOR ALL USING (EXISTS (SELECT 1 FROM usuario u JOIN rol r ON r.id_rol = u.id_rol WHERE u.auth_uid = auth.uid() AND r.nombre = 'ADMINISTRADOR'));
CREATE POLICY p_admin_ve_todo_trayecto ON trayecto FOR ALL USING (EXISTS (SELECT 1 FROM usuario u JOIN rol r ON r.id_rol = u.id_rol WHERE u.auth_uid = auth.uid() AND r.nombre = 'ADMINISTRADOR'));
CREATE POLICY p_admin_ve_todo_resultado ON resultado_inspeccion FOR ALL USING (EXISTS (SELECT 1 FROM usuario u JOIN rol r ON r.id_rol = u.id_rol WHERE u.auth_uid = auth.uid() AND r.nombre = 'ADMINISTRADOR'));
CREATE POLICY p_admin_ve_todo_mensaje ON mensaje FOR ALL USING (EXISTS (SELECT 1 FROM usuario u JOIN rol r ON r.id_rol = u.id_rol WHERE u.auth_uid = auth.uid() AND r.nombre = 'ADMINISTRADOR'));

-- ==========================================
-- POLÍTICAS PARA EL CLIENTE
-- ==========================================
-- El cliente solo ve su propio perfil de usuario
CREATE POLICY p_cliente_ve_su_usuario ON usuario FOR SELECT USING (auth_uid = auth.uid());

-- El cliente solo ve sus propios datos de cliente
CREATE POLICY p_cliente_ve_sus_datos ON cliente FOR SELECT USING (EXISTS (SELECT 1 FROM usuario u WHERE u.id_usuario = cliente.id_usuario AND u.auth_uid = auth.uid()));

-- El cliente solo ve sus propios domicilios
CREATE POLICY p_cliente_ve_sus_domicilios ON domicilio FOR SELECT USING (EXISTS (SELECT 1 FROM cliente c JOIN usuario u ON u.id_usuario = c.id_usuario WHERE c.id_cliente = domicilio.id_cliente AND u.auth_uid = auth.uid()));

-- El cliente solo ve sus propias inspecciones
CREATE POLICY p_cliente_ve_sus_inspecciones ON inspeccion FOR SELECT USING (
  EXISTS (SELECT 1 FROM cliente c
            JOIN usuario u ON u.id_usuario = c.id_usuario
           WHERE c.id_cliente = inspeccion.id_cliente
             AND u.auth_uid = auth.uid())
);

-- El cliente solo ve las notificaciones dirigidas a sus dispositivos
CREATE POLICY p_cliente_ve_sus_notificaciones ON notificacion FOR SELECT USING (
  EXISTS (SELECT 1 FROM dispositivo d
            JOIN usuario u ON u.id_usuario = d.id_usuario
           WHERE d.id_dispositivo = notificacion.id_dispositivo
             AND u.auth_uid = auth.uid())
);

-- El cliente solo ve el trayecto de su propia inspección (si está activo)
CREATE POLICY p_cliente_ve_su_trayecto ON trayecto FOR SELECT USING (
  EXISTS (SELECT 1 FROM inspeccion i
            JOIN cliente c ON c.id_cliente = i.id_cliente
            JOIN usuario u ON u.id_usuario = c.id_usuario
           WHERE i.id_inspeccion = trayecto.id_inspeccion
             AND u.auth_uid = auth.uid())
);

-- La ubicación solo es visible con el trayecto ACTIVO y solo para el cliente de esa cita
CREATE POLICY p_ubicacion_solo_trayecto_activo ON punto_ubicacion FOR SELECT USING (
  EXISTS (
    SELECT 1
      FROM trayecto  t
      JOIN inspeccion i ON i.id_inspeccion = t.id_inspeccion
      JOIN cliente    c ON c.id_cliente    = i.id_cliente
      JOIN usuario    u ON u.id_usuario    = c.id_usuario
     WHERE t.id_trayecto = punto_ubicacion.id_trayecto
       AND t.estado = 'ACTIVO'
       AND u.auth_uid = auth.uid()
  )
);

-- El cliente ve los resultados de sus inspecciones
CREATE POLICY p_cliente_ve_sus_resultados ON resultado_inspeccion FOR SELECT USING (
  EXISTS (SELECT 1 FROM inspeccion i
            JOIN cliente c ON c.id_cliente = i.id_cliente
            JOIN usuario u ON u.id_usuario = c.id_usuario
           WHERE i.id_inspeccion = resultado_inspeccion.id_inspeccion
             AND u.auth_uid = auth.uid())
);

-- ==========================================
-- POLÍTICAS PARA EL INSPECTOR
-- ==========================================
-- El inspector solo ve las inspecciones que tiene asignadas
CREATE POLICY p_inspector_ve_asignadas ON inspeccion FOR SELECT USING (
  EXISTS (SELECT 1 FROM inspector i
            JOIN usuario u ON u.id_usuario = i.id_usuario
           WHERE i.id_inspector = inspeccion.id_inspector
             AND u.auth_uid = auth.uid())
);

-- El inspector puede ver los domicilios de las inspecciones que tiene asignadas
CREATE POLICY p_inspector_ve_domicilios_asignados ON domicilio FOR SELECT USING (
  EXISTS (SELECT 1 FROM inspeccion ins
            JOIN inspector i ON i.id_inspector = ins.id_inspector
            JOIN usuario u ON u.id_usuario = i.id_usuario
           WHERE ins.id_domicilio = domicilio.id_domicilio
             AND u.auth_uid = auth.uid())
);

-- El inspector puede ver/crear los trayectos de sus inspecciones
CREATE POLICY p_inspector_gestiona_trayectos ON trayecto FOR ALL USING (
  EXISTS (SELECT 1 FROM inspector i
            JOIN usuario u ON u.id_usuario = i.id_usuario
           WHERE i.id_inspector = trayecto.id_inspector
             AND u.auth_uid = auth.uid())
);

-- El inspector puede crear puntos de ubicación para sus trayectos activos
CREATE POLICY p_inspector_crea_puntos ON punto_ubicacion FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM trayecto t
            JOIN inspector i ON i.id_inspector = t.id_inspector
            JOIN usuario u ON u.id_usuario = i.id_usuario
           WHERE t.id_trayecto = punto_ubicacion.id_trayecto
             AND t.estado = 'ACTIVO'
             AND u.auth_uid = auth.uid())
);

-- ==========================================
-- MENSAJERÍA COMPARTIDA (Inspector <-> Cliente)
-- ==========================================
CREATE POLICY p_usuarios_ven_sus_mensajes ON mensaje FOR SELECT USING (
  EXISTS (SELECT 1 FROM usuario u 
           WHERE (u.id_usuario = mensaje.de_usuario OR u.id_usuario = mensaje.para_usuario) 
             AND u.auth_uid = auth.uid())
);
