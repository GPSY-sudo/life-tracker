import { store } from './store';

const delay = (ms = 50) => new Promise((r) => setTimeout(r, ms));

export const diaryService = {
  async getDiary(date: string): Promise<string> {
    await delay();
    return store.getDay(date)?.diaryNote ?? '';
  },

  async saveDiary(date: string, note: string): Promise<void> {
    await delay();
    store.setDiaryNote(date, note);
  },

  async hasDiary(date: string): Promise<boolean> {
    await delay();
    const day = store.dailyRecords[date];
    return !!day && day.diaryNote.trim().length > 0;
  },
};
