import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Calendar,
  CalendarDays,
  Coffee,
  Filter,
  Printer,
  User,
} from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Layout } from "../components/layout";
import {
  Button,
  Card,
  EmptyState,
  PageHead,
  SearchInput,
  Select,
  Spinner,
  useToast,
  cn,
} from "../components/ui";
import {
  type ClassRow,
  type TimeTableDirectoryDto,
  type TimeTableEntryDto,
  type TimeTableResponse,
} from "../lib/types";

const DAYS_ORDER = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

const SLOTS_META = [
  { index: 1, time: "09:10 - 10:00", label: "Lect. 01" },
  { index: 2, time: "10:00 - 10:50", label: "Lect. 02" },
  { index: 3, time: "10:50 - 11:40", label: "Lect. 03" },
  { index: 4, time: "11:40 - 12:30", label: "Lect. 04" },
  { index: 5, time: "12:30 - 13:30", label: "Lect. 05", isLunch: true },
  { index: 6, time: "13:30 - 14:20", label: "Lect. 06" },
  { index: 7, time: "14:20 - 15:10", label: "Lect. 07" },
  { index: 8, time: "15:10 - 16:00", label: "Lect. 08" },
  { index: 9, time: "16:00 - 16:50", label: "Lect. 09" },
];

export function TimeTablePage() {
  const { token, user } = useAuth();
  const toast = useToast();

  const isAdmin = user?.role === "ADMIN";
  const isTeacher = user?.role === "TEACHER";

  const [data, setData] = useState<TimeTableResponse | null>(null);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<string>("ALL");
  const [directorySearch, setDirectorySearch] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Load classes for admin/teacher dropdown
  useEffect(() => {
    if (isAdmin || isTeacher) {
      api.classes.list(token).then((res) => {
        setClasses(res);
        const aiml = res.find((c) => c.id === "c_aiml_e" || c.name.includes("AIML"));
        if (aiml) {
          setSelectedClassId(aiml.id);
        } else if (res.length > 0) {
          setSelectedClassId(res[0].id);
        }
      }).catch(console.error);
    }
  }, [isAdmin, isTeacher, token]);

  // Load timetable
  const fetchTimeTable = async (classId?: string) => {
    setLoading(true);
    try {
      const res = await api.timetable.get(token, classId);
      setData(res);
      if (!selectedClassId && res.classId) {
        setSelectedClassId(res.classId);
      }
    } catch (err: any) {
      toast.push("error", err.message || "Failed to load time table.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeTable(selectedClassId || undefined);
  }, [selectedClassId]);

  // Map entries by Day -> Slot
  const gridMap = useMemo(() => {
    const map = new Map<string, Map<number, TimeTableEntryDto>>();
    DAYS_ORDER.forEach((day) => map.set(day, new Map()));
    data?.entries?.forEach((entry) => {
      const dayMap = map.get(entry.dayOfWeek.toUpperCase());
      if (dayMap) {
        dayMap.set(entry.slotIndex, entry);
      }
    });
    return map;
  }, [data]);

  // Filtered directory items
  const filteredDirectory = useMemo(() => {
    if (!data?.directory) return [];
    if (!directorySearch.trim()) return data.directory;
    const q = directorySearch.toLowerCase();
    return data.directory.filter(
      (item) =>
        item.subjectName.toLowerCase().includes(q) ||
        item.subjectCode.toLowerCase().includes(q) ||
        item.employeeName.toLowerCase().includes(q) ||
        item.departmentName.toLowerCase().includes(q) ||
        item.employeeCode.includes(q)
    );
  }, [data, directorySearch]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Layout title="Class Time Table" sub="Academic Schedule & Faculty Directory">
      <div className="space-y-6 max-w-7xl mx-auto pb-12 print:p-0 print:max-w-none">
        {/* Page Header */}
        <div className="print:hidden">
          <PageHead
            title="Class Time Table"
            sub="Official academic schedule, lecture timings, lab allocations, and faculty directory."
          >
            <div className="flex flex-wrap items-center gap-3">
              {(isAdmin || isTeacher) && classes.length > 0 && (
                <div className="w-56">
                  <Select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.branch} - Sec {c.section})
                      </option>
                    ))}
                  </Select>
                </div>
              )}
              <Button variant="outline" icon={Printer} onClick={handlePrint}>
                Print / Save PDF
              </Button>
            </div>
          </PageHead>
        </div>

        {loading ? (
          <Card className="py-24 flex flex-col items-center justify-center gap-3">
            <Spinner className="w-8 h-8 text-brand-600" />
            <p className="text-xs text-slate-500 font-medium">Loading timetable and academic schedule...</p>
          </Card>
        ) : !data ? (
          <Card>
            <EmptyState
              icon={CalendarDays}
              title="No Timetable Available"
              hint="Could not find any timetable records for the selected class."
            />
          </Card>
        ) : (
          <>
            {/* Day Filter Pills for Quick Switch */}
            <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 print:hidden">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
                  <Filter className="h-3.5 w-3.5" /> Day:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedDay("ALL")}
                  className={cn(
                    "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                    selectedDay === "ALL"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  )}
                >
                  Full Week (Grid)
                </button>
                {DAYS_ORDER.map((day) => {
                  const active = selectedDay === day;
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setSelectedDay(day)}
                      className={cn(
                        "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                        active
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                      )}
                    >
                      {day.slice(0, 3)}
                    </button>
                  );
                })}
              </div>

              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>9 Periods (09:10 – 16:50)</span>
              </div>
            </div>

            {/* Weekly Timetable Grid */}
            <Card className="overflow-hidden border border-slate-200 shadow-xs">
              <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-base">
                    Weekly Schedule Matrix
                  </h3>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-xs bg-blue-100 border border-blue-400" />
                    <span className="text-slate-600">Theory</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-xs bg-purple-100 border border-purple-400" />
                    <span className="text-slate-600">Practical / Lab</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-xs bg-amber-100 border border-amber-400" />
                    <span className="text-slate-600">Lunch Break</span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1050px]">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-600">
                      <th className="p-3 font-bold w-24 sticky left-0 z-20 bg-slate-100 border-r border-slate-200">
                        Day
                      </th>
                      {SLOTS_META.map((slot) => (
                        <th
                          key={slot.index}
                          className={cn(
                            "p-2.5 text-center font-semibold border-r border-slate-200 last:border-r-0",
                            slot.isLunch
                              ? "bg-amber-50/70 text-amber-900 w-24"
                              : "min-w-[125px]"
                          )}
                        >
                          <div className="font-bold">{slot.label}</div>
                          <div className="text-[10px] font-normal text-slate-500 tracking-tight whitespace-nowrap">
                            {slot.time}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {DAYS_ORDER.filter((d) => selectedDay === "ALL" || selectedDay === d).map((day) => {
                      const dayEntries = gridMap.get(day);
                      return (
                        <tr key={day} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3 font-bold text-slate-900 sticky left-0 z-10 bg-white border-r border-slate-200 shadow-2xs">
                            <div className="flex flex-col items-start">
                              <span className="text-xs uppercase">{day}</span>
                              <span className="text-[10px] text-indigo-600 font-medium">
                                Day {DAYS_ORDER.indexOf(day) + 1}
                              </span>
                            </div>
                          </td>

                          {SLOTS_META.map((slot) => {
                            const entry = dayEntries?.get(slot.index);

                            if (slot.isLunch) {
                              return (
                                <td
                                  key={slot.index}
                                  className="p-2 text-center bg-amber-50/40 border-r border-slate-200"
                                >
                                  <div className="flex flex-col items-center justify-center py-2 text-amber-700">
                                    <Coffee className="h-4 w-4 mb-1 opacity-75" />
                                    <span className="text-[10px] font-bold tracking-widest uppercase">
                                      LUNCH
                                    </span>
                                  </div>
                                </td>
                              );
                            }

                            if (!entry) {
                              return (
                                <td
                                  key={slot.index}
                                  className="p-2 text-center text-slate-400 border-r border-slate-200"
                                >
                                  <span className="text-[11px] italic">Free</span>
                                </td>
                              );
                            }

                            const isPractical = entry.subjectType === "Practical";
                            const isSplit = entry.groupType === "G1/G2" || entry.splitDisplay;

                            return (
                              <td
                                key={slot.index}
                                className={cn(
                                  "p-2 align-top border-r border-slate-200 last:border-r-0 transition-colors",
                                  isPractical
                                    ? "bg-purple-50/30 hover:bg-purple-50/60"
                                    : "bg-blue-50/20 hover:bg-blue-50/40"
                                )}
                              >
                                {isSplit ? (
                                  <div className="flex flex-col h-full justify-between gap-1 p-1 bg-white/90 rounded-md border border-purple-200 shadow-2xs">
                                    <div className="text-[11px] font-bold text-purple-900 leading-snug">
                                      {entry.splitDisplay ? (
                                        entry.splitDisplay.includes(",") ? (
                                          <>
                                            <div>{entry.splitDisplay.split(",")[0].trim()},</div>
                                            <div>{entry.splitDisplay.split(",")[1].trim()}</div>
                                          </>
                                        ) : (
                                          <div>{entry.splitDisplay}</div>
                                        )
                                      ) : (
                                        <div>{entry.subjectCode}</div>
                                      )}
                                    </div>
                                    <div className="text-[9px] font-semibold text-purple-600 truncate mt-0.5">
                                      {entry.subjectName}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-col h-full justify-between gap-1 p-1">
                                    <div>
                                      <div className="font-bold text-[11.5px] text-slate-800 tracking-tight">
                                        {entry.subjectCode}({entry.groupType || "ALL"})
                                      </div>
                                      <div className="text-[9.5px] font-medium text-slate-500 line-clamp-1 mt-0.5">
                                        {entry.subjectName}
                                      </div>
                                    </div>

                                    {entry.teacherName && (
                                      <div className="text-[11px] font-bold uppercase text-brand-700 tracking-wide mt-1 pt-1 border-t border-slate-100/80">
                                        {entry.teacherName.split(" ")[0]}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Faculty & Subject Directory Section */}
            <div className="space-y-4 pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Faculty & Subject Directory
                    </h3>
                    <p className="text-xs text-slate-500">
                      Directory of theory courses, lab practicals, assigned faculty, and employee codes.
                    </p>
                  </div>
                </div>

                <div className="w-full sm:w-72">
                  <SearchInput
                    value={directorySearch}
                    onChange={setDirectorySearch}
                    placeholder="Search faculty or subject..."
                  />
                </div>
              </div>

              <Card className="overflow-hidden border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100/90 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-600">
                        <th className="py-3 px-4 font-bold w-14 text-center">S.No.</th>
                        <th className="py-3 px-4 font-bold w-24">Type</th>
                        <th className="py-3 px-4 font-bold">Subject Name</th>
                        <th className="py-3 px-4 font-bold w-28">Sub Code</th>
                        <th className="py-3 px-4 font-bold w-24">Emp Code</th>
                        <th className="py-3 px-4 font-bold">Faculty / Employee Name</th>
                        <th className="py-3 px-4 font-bold w-28">Dept</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredDirectory.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-slate-500">
                            No matching subjects or faculty found in directory.
                          </td>
                        </tr>
                      ) : (
                        filteredDirectory.map((item) => (
                          <tr
                            key={item.sNo}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            <td className="py-3 px-4 text-center font-bold text-slate-500">
                              {item.sNo}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded-full text-[10px] font-semibold",
                                  item.subjectType === "Theory"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-purple-100 text-purple-800"
                                )}
                              >
                                {item.subjectType}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {item.subjectName}
                            </td>
                            <td className="py-3 px-4 font-mono font-medium text-slate-700">
                              {item.subjectCode}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-600">
                              {item.employeeCode}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-900">
                              {item.employeeName}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-semibold text-indigo-600">
                                {item.departmentName}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
export default TimeTablePage;
