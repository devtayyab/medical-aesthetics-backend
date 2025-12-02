import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Task } from "@/types";
import { TaskAPI } from "@/services/api";
interface TaskState {
    tasks: Task[];
    isLoading: boolean;
    error: string | null;
    selectedTask: Task | null;
}

const initialState: TaskState = {
    tasks: [],
    isLoading: false,
    error: null,
    selectedTask: null,
};

// ✅ Create Task
export const createTask = createAsyncThunk(
    "task/createTask",
    async (data: { 
        description: string; 
        type: string; 
        dueDate: string; 
        assignedTo: string; 
        metadata: Record<string, any>;
        customerId: string;
    }) => {
        const response = await TaskAPI.createTask(data);
        return response.data;
    }
);

// ✅ Update Task (fixed argument handling)

interface UpdateTaskPayload {
    id: string;
    updates: Partial<Task>;
}
export const UpdateTask = createAsyncThunk(
    "task/updateTask",
    async (data: UpdateTaskPayload) => {
        if (data.updates.status) {
            data.updates.status = data.updates.status as Task["status"];
        }
        const response = await TaskAPI.updateTask(data.id, data.updates);
        return response.data;
    }
);

// ✅ Delete Task
export const DeleteTask = createAsyncThunk(
    "task/deleteTask",
    async (id: string) => {
        await TaskAPI.deleteTask(id);
        return id;
    }
);

// ✅ Fetch All Tasks
export const fetchTasks = createAsyncThunk("task/fetchTasks", async () => {
    const response = await TaskAPI.getTasks();
    return response.data;
});

// ✅ Slice
const taskSlice = createSlice({
    name: "task",
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearTasks: (state) => {
            state.tasks = [];
        },
        clearSelectedTask: (state) => {
            state.selectedTask = null;
        },
        setSelectedTask: (state, action: PayloadAction<Task | null>) => {
            state.selectedTask = action.payload;
        },
        setTasks: (state, action: PayloadAction<Task[]>) => {
            state.tasks = action.payload;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
    },
    extraReducers: (builder) => {
        // Create
        builder.addCase(createTask.fulfilled, (state, action) => {
            state.tasks.push(action.payload);
        });
        // Update
        builder.addCase(UpdateTask.fulfilled, (state, action) => {
            state.tasks = state.tasks.map((task) =>
                task.id === action.payload.id ? action.payload : task
            );
        });
        // Delete
        builder.addCase(DeleteTask.fulfilled, (state, action) => {
            state.tasks = state.tasks.filter((task) => task.id !== action.payload);
        });
        // Fetch
        builder.addCase(fetchTasks.pending, (state) => {
            state.isLoading = true;
        });
        builder.addCase(fetchTasks.fulfilled, (state, action) => {
            state.isLoading = false;
            state.tasks = action.payload;
        });
        builder.addCase(fetchTasks.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error.message || "Failed to fetch tasks";
        });
    },
});

export const {
    clearError,
    clearTasks,
    clearSelectedTask,
    setSelectedTask,
    setTasks,
    setLoading,
    setError,
} = taskSlice.actions;

export default taskSlice.reducer;
