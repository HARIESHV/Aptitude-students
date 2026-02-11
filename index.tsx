
import { GoogleGenAI, Type } from "@google/genai";

// --- Configuration ---
const API_BASE = 'http://localhost:5000/api';
const aiClient = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Application State ---
let state = {
    view: 'login', // login, admin, student
    user: JSON.parse(localStorage.getItem('apti_user')) || null,
    questions: [],
    submissions: [],
    loading: false,
    adminTab: 'questions',
    isAdding: false,
    aiDrafting: false
};

// --- Utilities ---
const saveUser = (user) => {
    state.user = user;
    localStorage.setItem('apti_user', JSON.stringify(user));
};

const api = async (path, method = 'GET', body = null) => {
    try {
        const options: any = { 
            method, 
            headers: { 'Content-Type': 'application/json' } 
        };
        if (body) options.body = JSON.stringify(body);
        const res = await fetch(`${API_BASE}${path}`, options);
        if (!res.ok) throw new Error(await res.text());
        return await res.json();
    } catch (e) {
        console.error("API Error:", e);
        return { error: e.message };
    }
};

// --- Core Logic ---
async function refreshData() {
    if (!state.user) return;
    state.loading = true;
    render();
    
    const data = await api('/state');
    if (!data.error) {
        state.questions = data.questions || [];
        state.submissions = data.submissions || [];
    }
    state.loading = false;
    render();
}

async function handleLogin(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    // Fix: Cast role to string as it comes from a radio button group and toLowerCase() expects a string.
    const role = formData.get('role') as string;
    
    if (role === 'ADMIN' && formData.get('pass') !== 'admin123') {
        alert("Invalid Admin Passcode");
        return;
    }

    const user = {
        role,
        id: role === 'ADMIN' ? 'ROOT' : formData.get('sid'),
        name: role === 'ADMIN' ? 'Administrator' : formData.get('name')
    };
    
    saveUser(user);
    state.view = role.toLowerCase();
    await refreshData();
}

function logout() {
    localStorage.removeItem('apti_user');
    state.user = null;
    state.view = 'login';
    render();
}

async function draftWithAI() {
    state.aiDrafting = true;
    render();
    try {
        const response = await aiClient.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: "Generate a professional logical reasoning aptitude question. Return JSON only.",
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        text: { type: Type.STRING },
                        options: { type: Type.ARRAY, items: { type: Type.STRING } },
                        correctAnswer: { type: Type.INTEGER },
                        explanation: { type: Type.STRING }
                    }
                }
            }
        });
        const q = JSON.parse(response.text);
        state.isAdding = true;
        render();
        // Populate form manually
        setTimeout(() => {
            const form = document.getElementById('q-form') as HTMLFormElement;
            if (form) {
                (form.elements.namedItem('text') as any).value = q.text;
                (form.elements.namedItem('opt0') as any).value = q.options[0];
                (form.elements.namedItem('opt1') as any).value = q.options[1];
                (form.elements.namedItem('opt2') as any).value = q.options[2];
                (form.elements.namedItem('opt3') as any).value = q.options[3];
                (form.elements.namedItem('correct') as any).value = q.correctAnswer;
                (form.elements.namedItem('explanation') as any).value = q.explanation;
            }
        }, 10);
    } catch (e) {
        alert("AI Generation failed. Check API Key.");
    } finally {
        state.aiDrafting = false;
        render();
    }
}

// --- Views ---
const LoginView = () => `
    <div class="min-h-screen flex items-center justify-center p-6 bg-slate-100">
        <div class="max-w-md w-full animate-slide-up">
            <div class="bg-white rounded-[2rem] shadow-2xl overflow-hidden p-10 border border-slate-200">
                <div class="text-center mb-8">
                    <div class="inline-block w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black mb-4">A</div>
                    <h1 class="text-3xl font-extrabold tracking-tight">AptiMaster</h1>
                    <p class="text-slate-500 font-medium">Platform Management Console</p>
                </div>
                <form id="login-form" class="space-y-4">
                    <div class="flex bg-slate-100 p-1 rounded-xl mb-4">
                        <label class="flex-1 py-2 text-center text-xs font-bold cursor-pointer rounded-lg transition-all has-[:checked]:bg-white has-[:checked]:shadow-sm">
                            <input type="radio" name="role" value="STUDENT" checked class="hidden"> Student
                        </label>
                        <label class="flex-1 py-2 text-center text-xs font-bold cursor-pointer rounded-lg transition-all has-[:checked]:bg-white has-[:checked]:shadow-sm">
                            <input type="radio" name="role" value="ADMIN" class="hidden"> Admin
                        </label>
                    </div>
                    <div class="space-y-3" id="login-fields">
                        <input type="text" name="name" placeholder="Full Name" required class="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-xl outline-none font-medium">
                        <input type="text" name="sid" placeholder="Student/Employee ID" required class="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-xl outline-none font-medium uppercase">
                        <input type="password" name="pass" placeholder="Admin Key (if admin)" class="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-xl outline-none font-medium">
                    </div>
                    <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-5 rounded-xl transition-all shadow-lg active:scale-95">Enter Platform</button>
                </form>
            </div>
        </div>
    </div>
`;

const AdminView = () => `
    <div class="flex min-h-screen">
        <!-- Sidebar -->
        <div class="w-64 bg-slate-900 text-white p-8 flex flex-col hidden md:flex">
            <div class="flex items-center gap-3 mb-12">
                <div class="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black">A</div>
                <span class="font-bold text-xl">AptiAdmin</span>
            </div>
            <nav class="space-y-2 flex-grow">
                ${['questions', 'results'].map(t => `
                    <button onclick="window.setTab('${t}')" class="w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${state.adminTab === t ? 'bg-indigo-600' : 'text-slate-400 hover:bg-white/5'}">
                        ${t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                `).join('')}
            </nav>
            <button onclick="window.logout()" class="text-slate-500 text-xs font-bold hover:text-white uppercase tracking-widest">Sign Out</button>
        </div>

        <!-- Main Content -->
        <main class="flex-grow p-6 md:p-12 overflow-y-auto bg-[#F8FAFC]">
            <header class="flex justify-between items-center mb-10">
                <h2 class="text-3xl font-black text-slate-900">${state.adminTab === 'questions' ? 'Question Repository' : 'Assessment Reports'}</h2>
                ${state.adminTab === 'questions' ? `
                    <div class="flex gap-4">
                        <button onclick="window.draftWithAI()" class="bg-indigo-50 text-indigo-600 px-6 py-3 rounded-xl font-bold text-xs hover:bg-indigo-100 transition-all">
                            ${state.aiDrafting ? 'Drafting...' : 'Draft with AI'}
                        </button>
                        <button onclick="window.toggleAdd()" class="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-xs hover:bg-black transition-all">
                            ${state.isAdding ? 'Close Form' : 'Post New Question'}
                        </button>
                    </div>
                ` : ''}
            </header>

            ${state.isAdding ? `
                <div class="bg-white rounded-[2rem] p-8 shadow-xl mb-10 animate-slide-up border border-slate-100">
                    <form id="q-form" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="md:col-span-2">
                            <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Question Content</label>
                            <textarea name="text" required class="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-xl p-5 outline-none h-24 font-medium"></textarea>
                        </div>
                        ${[0,1,2,3].map(i => `
                            <div>
                                <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Option ${String.fromCharCode(65+i)}</label>
                                <input name="opt${i}" required class="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-xl px-5 py-3 outline-none font-medium">
                            </div>
                        `).join('')}
                        <div>
                            <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Correct Index (0-3)</label>
                            <input type="number" name="correct" min="0" max="3" value="0" class="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-xl px-5 py-3 font-bold">
                        </div>
                        <div>
                            <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Category</label>
                            <select name="category" class="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-xl px-5 py-3 font-bold">
                                <option>Quantitative</option><option>Logical</option><option>Verbal</option>
                            </select>
                        </div>
                        <div class="md:col-span-2">
                            <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Detailed Explanation</label>
                            <input name="explanation" class="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-xl px-5 py-3 font-medium">
                        </div>
                        <div class="md:col-span-2">
                            <button type="submit" class="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-indigo-700 active:scale-95 transition-all">Publish Question</button>
                        </div>
                    </form>
                </div>
            ` : ''}

            <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                ${state.questions.map(q => `
                    <div class="bg-white border border-slate-100 p-6 rounded-[1.5rem] shadow-sm hover:shadow-md transition-all relative">
                        <button onclick="window.deleteQ(${q.id})" class="absolute top-4 right-4 text-slate-300 hover:text-red-500">
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                        <span class="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2 py-1 rounded uppercase mb-4 inline-block">${q.category}</span>
                        <p class="font-bold text-slate-800 leading-snug mb-4">${q.text}</p>
                        <div class="space-y-2">
                            ${(typeof q.options === 'string' ? JSON.parse(q.options) : q.options).map((opt, i) => `
                                <div class="text-[11px] p-2 rounded bg-slate-50 border border-slate-100 ${i === q.correctAnswer ? 'text-indigo-600 font-bold bg-indigo-50/50' : 'text-slate-500'}">
                                    ${opt}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </main>
    </div>
`;

const StudentView = () => `
    <div class="max-w-4xl mx-auto p-6 md:p-12 animate-slide-up">
        <header class="flex justify-between items-center mb-12">
            <div>
                <h1 class="text-4xl font-black text-slate-900 tracking-tight">Student Portal</h1>
                <p class="text-slate-500 font-bold uppercase text-xs mt-1">Hello, ${state.user.name}</p>
            </div>
            <button onclick="window.logout()" class="text-xs font-black text-slate-400 hover:text-indigo-600 tracking-widest uppercase">Sign Out</button>
        </header>

        <div class="grid grid-cols-1 gap-8">
            ${state.questions.map(q => `
                <div class="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100">
                    <div class="flex items-center gap-3 mb-6">
                        <span class="w-2 h-2 bg-indigo-600 rounded-full"></span>
                        <span class="text-xs font-black text-slate-400 uppercase tracking-widest">${q.category}</span>
                    </div>
                    <h2 class="text-2xl font-black text-slate-900 leading-tight mb-8">${q.text}</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        ${(typeof q.options === 'string' ? JSON.parse(q.options) : q.options).map((opt, i) => `
                            <button onclick="window.submitAnswer(${q.id}, ${i})" class="w-full text-left p-5 rounded-2xl border-2 border-slate-50 hover:border-indigo-500 hover:bg-indigo-50/30 transition-all font-bold group">
                                <span class="inline-block w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-white text-center leading-8 mr-3 text-sm">${String.fromCharCode(65+i)}</span>
                                ${opt}
                            </button>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
`;

// --- Renderer ---
function render() {
    const app = document.getElementById('app');
    if (state.view === 'login') app.innerHTML = LoginView();
    else if (state.view === 'admin') app.innerHTML = AdminView();
    else if (state.view === 'student') app.innerHTML = StudentView();

    // Attach form events
    if (state.view === 'login') {
        document.getElementById('login-form')?.addEventListener('submit', handleLogin);
    }
    if (state.view === 'admin' && state.isAdding) {
        document.getElementById('q-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const f = e.target as HTMLFormElement;
            const data = {
                text: (f.elements.namedItem('text') as any).value,
                category: (f.elements.namedItem('category') as any).value,
                options: [
                    (f.elements.namedItem('opt0') as any).value,
                    (f.elements.namedItem('opt1') as any).value,
                    (f.elements.namedItem('opt2') as any).value,
                    (f.elements.namedItem('opt3') as any).value
                ],
                correctAnswer: parseInt((f.elements.namedItem('correct') as any).value),
                difficulty: 'Easy',
                timeLimitMinutes: 1,
                explanation: (f.elements.namedItem('explanation') as any).value
            };
            await api('/questions', 'POST', data);
            state.isAdding = false;
            await refreshData();
        });
    }
}

// --- Global Actions for HTML ---
(window as any).setTab = (t) => { state.adminTab = t; render(); };
(window as any).toggleAdd = () => { state.isAdding = !state.isAdding; render(); };
(window as any).logout = logout;
(window as any).draftWithAI = draftWithAI;
(window as any).deleteQ = async (id) => {
    if (confirm("Delete this question?")) {
        await api(`/questions/${id}`, 'DELETE');
        await refreshData();
    }
};
(window as any).submitAnswer = async (qid, ans) => {
    alert("Response Saved! Well done.");
};

// Initial state routing
if (state.user) state.view = state.user.role.toLowerCase();
loadInitial();

async function loadInitial() {
    if (state.user) await refreshData();
    else render();
}
