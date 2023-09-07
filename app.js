const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const isMatch = require("date-fns/isMatch");
const isValid = require("date-fns/isValid");
const format = require("date-fns/format");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const isStatusAndPriorityProperty = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.property !== undefined
  );
};

const isPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const isStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const isCategoryAndPriorityProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const isSearchProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};
const isCategoryAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.property !== undefined
  );
};

const isCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};
const getTodoDetails = (eachTodoObj) => {
  return {
    id: eachTodoObj.id,
    todo: eachTodoObj.todo,
    priority: eachTodoObj.priority,
    status: eachTodoObj.status,
    category: eachTodoObj.category,
    dueDate: eachTodoObj.due_date,
  };
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodoQuery = "";
  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    case isStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodoQuery = `
        SELECT * 
        FROM todo
        WHERE   
         status = '${status}'
        `;
        data = await db.all(getTodoQuery);
        response.send(data.map((eachTodo) => getTodoDetails(eachTodo)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }

      break;
    case isPriorityProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodoQuery = `
            SELECT *
            FROM todo
            WHERE  
            priority = '${priority}'                         
            `;
        data = await db.all(getTodoQuery);
        response.send(data.map((eachTodo) => getTodoDetails(eachTodo)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;
    case isStatusAndPriorityProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodoQuery = `
                        SELECT * 
                        FROM todo
                        WHERE  
                        status = '${status}'
                        AND priority = '${priority}'
                        `;
          data = await db.all(getTodoQuery);
          response.send(data.map((eachTodo) => getTodoDetails(eachTodo)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;
    case isCategoryAndStatusProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodoQuery = `
                                    SELECT * 
                                    FROM todo
                                    WHERE  status = '${status}'
                                    AND category = '${category}'
                                    `;
          data = await db.all(getTodoQuery);
          response.send(data.map((eachTodo) => getTodoDetails(eachTodo)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;
    case isCategoryAndPriorityProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          getTodoQuery = `
                                        SELECT * 
                                        FROM todo
                                        WHERE   priority = '${priority}'
                                        AND category = '${category}'
                                        `;
          data = await db.all(getTodoQuery);
          response.send(data.map((eachTodo) => getTodoDetails(eachTodo)));
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;
    case isCategoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodoQuery = `
                        SELECT * 
                        FROM todo
                        WHERE category = '${category}'
                        `;
        data = await db.all(getTodoQuery);
        response.send(data.map((eachTodo) => getTodoDetails(eachTodo)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;

    case isSearchProperty(request.query):
      getTodoQuery = `
          SELECT * FROM todo WHERE todo LIKE '%${search_q}%'`;
      data = await db.all(getTodoQuery);
      response.send(data.map((eachTodo) => getTodoDetails(eachTodo)));
      break;
    // default:
    //   const getAllTodos = `
    //       SELECT * FROM todo`;
    //   data = await db.all(getAllTodos);
    //   response.send(data.map((eachTodo) => getTodoDetails(eachTodo)));
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoIdQuery = `
    SELECT * FROM todo WHERE id = ${todoId}`;
  const todoIdObj = await db.get(getTodoIdQuery);
  response.send({
    id: todoIdObj.id,
    todo: todoIdObj.todo,
    priority: todoIdObj.priority,
    status: todoIdObj.status,
    category: todoIdObj.category,
    dueDate: todoIdObj.due_date,
  });
});
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  console.log(isMatch(date, "yyyy-MM-dd"));
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    console.log(newDate);
    const getTodoDateQuery = `
      SELECT * FROM todo WHERE due_date = '${newDate}'`;
    const todoDate = await db.all(getTodoDateQuery);
    response.send(todoDate.map((eachTodo) => getTodoDetails(eachTodo)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const postNewDueDate = format(new Date(dueDate), "yyyy-MM-dd");
          const createNewTodo = `
                INSERT INTO todo(id, todo, priority, status, category, due_date)
                VALUES ('${id}', '${todo}', '${priority}', '${status}', '${category}', '${postNewDueDate}')`;
          await db.run(createNewTodo);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  const previousTodoQuery = `SELECT * FROM todo WHERE id = ${todoId}`;
  await db.get(previousTodoQuery);
  const {
    id = previousTodoQuery.id,
    todo = previousTodoQuery.todo,
    category = previousTodoQuery.category,
    priority = previousTodoQuery.priority,
    status = previousTodoQuery.status,
    dueDate = previousTodoQuery.due_date,
  } = request.body;
  let updateTodoQuery;
  switch (true) {
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodoQuery = `
          UPDATE todo SET id = '${id}', todo = '${todo}', category = '${category}', status = '${status}', due_date = '${dueDate}'
          WHERE id = ${todoId}`;
        await db.run(updateTodoQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        updateTodoQuery = `
           UPDATE todo SET id = '${id}', todo = '${todo}', category = '${category}', status = '${status}', due_date = '${dueDate}'
          WHERE id = ${todoId} `;
        await db.run(updateTodoQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case requestBody.todo !== undefined:
      updateTodoQuery = `
        UPDATE todo SET id = '${id}', todo = '${todo}', category = '${category}', status = '${status}', due_date = '${dueDate}'
          WHERE id = ${todoId}`;
      await db.run(updateTodoQuery);
      response.send("Todo Updated");
      break;
    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateTodoQuery = `
            UPDATE todo SET id = '${id}', todo = '${todo}', category = '${category}', status = '${status}', due_date = '${dueDate}'
          WHERE id = ${todoId}`;
        await db.run(updateTodoQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const updateDueDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateTodoQuery = `
            UPDATE todo SET id = '${id}', todo = '${todo}', category = '${category}', status = '${status}', due_date = '${updateDueDate}'
          WHERE id = ${todoId}`;
        await db.run(updateTodoQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
   SELECT * FROM todo WHERE id = ${todoId}`;
const deleteTodo =  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
