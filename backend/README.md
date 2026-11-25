# Backend API — SADMG / DSS (Node.js + Express)

Plantilla base lista para conectar con la base de datos MySQL en **TiDB Cloud** y desplegar en **Render**.

---

## 1. Correr en local

```bash
cd backend
npm install
cp .env.example .env
# Edita .env con las credenciales reales de TiDB Cloud
npm run dev
```

Prueba en tu navegador:
* `http://localhost:3000/api/health` → Debe devolver `"status": "ok"` y `"tables_count": 15`.
* `http://localhost:3000/api/proyectos` → Lista el proyecto de prueba.
* `http://localhost:3000/api/proyectos/1/scoring` → Devuelve el ranking multicriterio calculado.

---

## 2. Desplegar en Render (Paso a paso)

1. Entra a [render.com](https://render.com/) e inicia sesión con GitHub.
2. Haz clic en **New +** → **Web Service**.
3. Conecta el repositorio `alaanvirtual/DSS--DATABASE-EQUIPO`.
4. Configura los campos exactamente así:
   * **Name:** `dss-sadmg-api` (o el nombre que prefieran)
   * **Root Directory:** `backend`
   * **Runtime:** `Node`
   * **Build Command:** `npm install`
   * **Start Command:** `npm start`
   * **Instance Type:** `Free`
5. En la sección **Environment Variables**, agrega estas 6 variables (con los datos de TiDB Cloud):
   * `DB_HOST`: *(tu host de TiDB)*
   * `DB_PORT`: `4000`
   * `DB_USER`: *(tu usuario de TiDB)*
   * `DB_PASSWORD`: *(tu contraseña de TiDB)*
   * `DB_NAME`: `dss_sadmg`
   * `DB_SSL`: `true`
6. Haz clic en **Deploy Web Service**.

Al terminar el despliegue, entra a `https://tu-servicio.onrender.com/api/health` para confirmar la conexión en producción.
