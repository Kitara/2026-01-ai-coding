import { useState, useEffect, type FormEvent } from 'react';
import createClient from 'openapi-fetch';
import type { paths } from '@/api_schema';
import styles from './TodoPage.module.css';

const client = createClient<paths>({ baseUrl: '' });

interface Todo {
  id: number;
  title: string;
  is_done: boolean;
  created_at: string;
}

export function TodoPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTodos = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await client.GET('/api/todos');
      if (fetchError) {
        setError('Failed to fetch todos');
        return;
      }
      setTodos(data || []);
    } catch (err) {
      setError('Failed to fetch todos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const handleAddTodo = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;

    setError(null);
    try {
      const { data, error: createError } = await client.POST('/api/todos', {
        body: { title: newTodoTitle },
      });
      if (createError) {
        setError('Failed to create todo');
        return;
      }
      if (data) {
        setTodos([data, ...todos]);
        setNewTodoTitle('');
      }
    } catch (err) {
      setError('Failed to create todo');
      console.error(err);
    }
  };

  const handleMarkDone = async (id: number) => {
    setError(null);
    try {
      const { data, error: updateError } = await client.PATCH('/api/todos/{todo_id}/done', {
        params: { path: { todo_id: id } },
      });
      if (updateError) {
        setError('Failed to mark todo as done');
        return;
      }
      if (data) {
        setTodos(todos.map((todo) => (todo.id === id ? data : todo)));
      }
    } catch (err) {
      setError('Failed to mark todo as done');
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    setError(null);
    try {
      const { error: deleteError } = await client.DELETE('/api/todos/{todo_id}', {
        params: { path: { todo_id: id } },
      });
      if (deleteError) {
        setError('Failed to delete todo');
        return;
      }
      setTodos(todos.filter((todo) => todo.id !== id));
    } catch (err) {
      setError('Failed to delete todo');
      console.error(err);
    }
  };

  return (
    <div className={styles.todoPage}>
      <h1>Todo Management</h1>

      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      <form onSubmit={handleAddTodo} className={styles.todoForm}>
        <input
          type="text"
          value={newTodoTitle}
          onChange={(e) => setNewTodoTitle(e.target.value)}
          placeholder="Enter a new todo..."
          className={styles.todoInput}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !newTodoTitle.trim()}>
          Add Todo
        </button>
      </form>

      {loading && todos.length === 0 ? (
        <p>Loading todos...</p>
      ) : (
        <div className={styles.todoList}>
          {todos.length === 0 ? (
            <p className={styles.emptyState}>No todos yet. Add one above!</p>
          ) : (
            <ul>
              {todos.map((todo) => (
                <li key={todo.id} className={`${styles.todoItem} ${todo.is_done ? styles.done : ''}`}>
                  <div className={styles.todoContent}>
                    <span className={todo.is_done ? styles.todoTitleDone : styles.todoTitle}>
                      {todo.title}
                    </span>
                    <span className={styles.todoDate}>
                      {new Date(todo.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className={styles.todoActions}>
                    {!todo.is_done && (
                      <button
                        onClick={() => handleMarkDone(todo.id)}
                        className={styles.btnDone}
                        disabled={loading}
                      >
                        ✓ Done
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(todo.id)}
                      className={styles.btnDelete}
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
