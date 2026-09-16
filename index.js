const express = require('express');
const jwt = require('jsonwebtoken');
const { users, todos } = require('./db');

const app = express();
const SECRET = 'mysecretkey';

app.use(express.json());

function verifyToken(req, res, next){
    const token = req.headers['authentication'];

    if(!token){
        return res.status(401).json({message : 'No token provided'})
    }

    try{
        const decoded = jwt.verify(token, SECRET);
        req.user = decoded;
        next();
    }catch(err){
        res.status(401).json({message: 'invalid token'})
    }
}

app.get('/todos', verifyToken, (req, res)=> {
    if(req.user.role === 'admin'){
        return res.json(todos);
    }

    const myTodos = todos.filter(todo => todo.userId === req.user.id);
    res.json(myTodos);
})


app.post('/todos', verifyToken, (req, res)=>{
    const {title} = req.body;

    if(!title){
        return res.status(400).json({message: 'title is required'});
    }

    const newTodo = {
        id: todos.length + 1,
        title: title,
        completed: false,
        userId: req.user.id
    };

    todos.push(newTodo);
    res.status(201).json(newTodo);
});

app.put('/todos/:id', verifyToken, (req,res) => {
    const todo = todos.find(t => t.id === parseInt(req.params.id));

    if(!todo){
        return res.status(404).json({message: 'Todo not found '});
    }

    if(req.user.role !== 'admin' && todo.userId !== req.user.id){
        return res.status(403).json({message: 'Not allowed'});
    }

    todo.title = req.body.title || todo.title;
    todo.completed = req.body.completed ?? todo.completed;

    res.json(todo);
});

app.delete('/todos/:id', verifyToken, (req, res)=>{
    const index = todos.findIndex(t => t.id === parseInt(req.params.id));

    if(index===-1){
        return res.status(404).json({message: 'todo not found'});
    }

    if(req.user.role !== 'admin' && todos[index].userId !== req.user.id){
        return res.status(403).json({message: 'Not allowed'});
    }

    todos.splice(index, 1);
    res.json({message: 'todo deleted'});
});

app.listen(3000, ()=>{
    console.log('server running on http://localhost:3000');
});