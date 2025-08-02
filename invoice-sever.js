const express = require('express');
const cors = require('cors'); // Import thư viện cors
const { Pool } = require('pg');
const tokenlib = require('jsonwebtoken');//khai báo thư viện jkt để tạo token cho mỗi lần đăng nhập

const app = express();
app.use(cors()); // Sử dụng middleware CORS
app.use(express.json());

// Cấu hình kết nối đến PostgreSQL
const pool = new Pool({
    // user: 'postgres', // Thay thế bằng username của bạn
    // host: '123.19.121.187',//địa chỉ ip công khai của máy fujitsu 
    // database: 'Invoice',
    // password: '1!Ngaycuoicung', // Thay thế bằng password của bạn
    // port: 5432,

    connectionString: 'postgresql://neondb_owner:npg_HoJmb5DBF6qG@ep-little-tree-a1x11z62-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    ssl: {
        rejectUnauthorized: false // Neon dùng SSL
    }
});

// Lấy dữ liệu từ bảng invoice_table
app.get('/Invoice', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];

    if (!token) return res.sendStatus(401); //nếu không có token thì thoát luôn không thực hiện đoạn sau 
    tokenlib.verify(token, 'DuoNgocY', (err, user) => {//xác thực token
        if (err) return res.sendStatus(403); //nếu token bị lỗi hoặc hết hạn cũng thoát luôn không thực hiện đoạn dưới

    });
    //thực hiện công việc cần khi đã xác thực token ok 
    let kieu_yeu_cau = req.query.yeucau;//Lấy giá trị thuột tính type của request từ client gán cho biến type
    let user_id = req.query.userid;
    let so_id = req.query.invid;//lấy số ID của invoice
    console.log("Đã nhận được yêu cầu từ client - ip công khai");//báo trên log là đã nhận được 1 yêu cầu từ client
    console.log("Kiểu yêu cầu : ", kieu_yeu_cau);
    console.log("User ID : ", user_id);
    if (kieu_yeu_cau === 'layhoadon') {
        try {
            query_string = "SELECT invoice_id,invoice_title,customer, SUM(price*quantity) AS amount,invoice_date FROM invoice_table WHERE user_id ='" + user_id + "' GROUP BY invoice_id,invoice_date,invoice_title,customer ORDER BY invoice_date DESC;"
            console.log("Câu truy vấn : ", query_string);
            const result = await pool.query(query_string);
            res.json(result.rows);
        } catch (err) {
            console.error(err);
            res.status(500).send('Lỗi khi lấy dữ liệu');
        }
    }
    else if (kieu_yeu_cau === 'chitiethoadon') {
        try {
            query_string = "SELECT product_name,quantity,price, SUM(price*quantity) AS amount FROM invoice_table WHERE invoice_id='" + so_id + "' group by product_name,quantity,price;";
            console.log(query_string);
            const result = await pool.query(query_string);
            res.json(result.rows);
        } catch (err) {
            console.error(err);
            res.status(500).send('Lỗi khi lấy dữ liệu');
        }
    }
    else if (kieu_yeu_cau==='xoahoadon'){
            
            try {
                query_string= "DELETE FROM invoice_table WHERE ivoice_id = '"+ so_id+"'";
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
    console.log("Đã nhận được yêu cầu từ client");//báo trên log là đã nhận được 1 yêu cầu từ client
    // console.log(product_name,price,quantity);
    try {
        results = [];
        for (product of product_array) {
            const { user_id, user_name, invoice_id, invoice_title, invoice_date, customer, product_name, price, quantity } = product;
            const result = await pool.query(
                'INSERT INTO invoice_table (user_id, user_name,invoice_id, invoice_title,invoice_date,customer,product_name,price, quantity) VALUES ($1, $2, $3,$4,$5,$6,$7,$8,$9) RETURNING *',
                [user_id, user_name, invoice_id, invoice_title, invoice_date, customer, product_name, price, quantity]
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

//1 luồng đơn giản để nhận tín hiệu ping từ trang web cron job (https://console.cron-job.org/jobs)giữ api trên render luôn thức
app.get('/ping', (req, res) => {
    res.send('pong!');
    console.log('Vừa nhận tín hiệu Ping từ cron-job!');
});

// Khởi động server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});