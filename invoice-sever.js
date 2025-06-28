const express = require('express');
const cors = require('cors'); // Import thư viện cors
const { Pool } = require('pg');

const app = express();
app.use(cors()); // Sử dụng middleware CORS
app.use(express.json());

// Cấu hình kết nối đến PostgreSQL
const pool = new Pool({
    user: 'postgres', // Thay thế bằng username của bạn
    host: '123.19.116.10',
    database: 'Invoice',
    password: '1!Ngaycuoicung', // Thay thế bằng password của bạn
    port: 5432,
});

// Lấy dữ liệu từ bảng invoice_table
app.get('/Invoice', async (req, res) => {
    let kieu_yeu_cau = req.query.yeucau;//Lấy giá trị thuột tính type của request từ client gán cho biến type
    let so_id = req.query.invid;//lấy số ID của invoice
    if (kieu_yeu_cau ==='layhoadon') {
        try {
            const result = await pool.query('SELECT invoice_id,invoice_title,customer, SUM(price*quantity) AS amount,invoice_date FROM invoice_table GROUP BY invoice_id,invoice_date,invoice_title,customer;');
            res.json(result.rows);
        } catch (err) {
            console.error(err);
            res.status(500).send('Lỗi khi lấy dữ liệu');
        }
    }
    else if(kieu_yeu_cau === 'chitiethoadon'){
        try {
            query_string = "SELECT product_name,quantity,price, SUM(price*quantity) AS amount FROM invoice_table WHERE invoice_id='" +so_id + "' group by product_name,quantity,price;"; 
            console.log(query_string);
            const result = await pool.query(query_string);
            res.json(result.rows);
        } catch (err) {
            console.error(err);
            res.status(500).send('Lỗi khi lấy dữ liệu');
        }
    }
});

// Thêm dữ liệu vào bảng invoice_table
app.post('/Invoice', async (req, res) => {
    const product_array = req.body;

    // console.log(product_name,price,quantity);
    try {
        results = [];
            for (product of product_array){
                const {invoice_id, invoice_title,invoice_date,customer,product_name,price, quantity} = product;
                const result = await pool.query(
                'INSERT INTO invoice_table (invoice_id, invoice_title,invoice_date,customer,product_name,price, quantity) VALUES ($1, $2, $3,$4,$5,$6,$7) RETURNING *',
                    [invoice_id, invoice_title,invoice_date,customer,product_name,price, quantity]
                );
                results.push(result.rows[0]); // Lưu kết quả vào mảng
            }
            res.status(201).json(results);//không gởi phản hồi trong vòng for vì nó sẽ kết thúc việc lưu dữ liệu ngay sau vòng lặp đầu tiên
        }
    catch (err) {
        console.error(err);
        res.status(500).send('Lỗi khi thêm dữ liệu');
    }
});

// Khởi động server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});