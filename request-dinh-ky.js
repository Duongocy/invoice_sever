const express = require('express');
const cors = require('cors'); // Import thư viện cors
const { Pool } = require('pg');
const tokenlib = require('jsonwebtoken');//khai báo thư viện jkt để tạo token cho mỗi lần đăng nhập
const cron = require('node-cron');

const app = express();
app.use(cors()); // Sử dụng middleware CORS
app.use(express.json());

// Cấu hình kết nối đến PostgreSQL
const pool = new Pool({
    user: 'postgres', // Thay thế bằng username của bạn
    host: '14.165.172.59',//địa chỉ ip công khai của máy fujitsu 
    database: 'Invoice',
    password: '1!Ngaycuoicung', // Thay thế bằng password của bạn
    port: 5432,
});

cron.schedule('* * * * *', async () => {
  console.log('Chạy mỗi phút!');
  try {            
            query_string = "SELECT invoice_id,invoice_title,customer, SUM(price*quantity) AS amount,invoice_date FROM invoice_table WHERE user_id ='"+user_id+"' GROUP BY invoice_id,invoice_date,invoice_title,customer ORDER BY invoice_date DESC;"
            console.log("Câu truy vấn : ",query_string);
            const result = await pool.query(query_string);
            res.json(result.rows);
        } catch (err) {
            console.error(err);
            res.status(500).send('Lỗi khi lấy dữ liệu');
        }
});

// Khởi động server
const PORT = 3002;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});