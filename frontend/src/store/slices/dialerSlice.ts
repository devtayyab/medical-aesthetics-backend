import { createSlice, PayloadAction, Reducer } from "@reduxjs/toolkit";

export interface DialerState {
  isOpen: boolean;
  customerName: string;
  phoneNumber: string;
  taskId: string | null;
  customerId: string | null;
  workflowStep: number;
}

const initialState: DialerState = {
  isOpen: false,
  customerName: "",
  phoneNumber: "",
  taskId: null,
  customerId: null,
  workflowStep: 0, // 0: Dialer, 1: Interaction Flow
};

const dialerSlice = createSlice({
  name: "dialer",
  initialState,
  reducers: {
    openDialer: (
      state,
      action: PayloadAction<{
        customerName: string;
        phoneNumber: string;
        taskId?: string;
        customerId?: string;
      }>
    ) => {
      state.isOpen = true;
      state.customerName = action.payload.customerName;
      state.phoneNumber = action.payload.phoneNumber;
      state.taskId = action.payload.taskId || null;
      state.customerId = action.payload.customerId || null;
      state.workflowStep = 0;
    },
    closeDialer: (state) => {
      state.isOpen = false;
      state.taskId = null;
    },
    setWorkflowStep: (state, action: PayloadAction<number>) => {
      state.workflowStep = action.payload;
    },
  },
});

export const { openDialer, closeDialer, setWorkflowStep } = dialerSlice.actions;
const dialerReducer: Reducer<DialerState> = dialerSlice.reducer;
export default dialerReducer;
