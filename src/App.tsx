import React, { useState, useCallback, useRef, useEffect } from 'react';
import { setThemeCookie, getThemeCookie, setLanguageCookie, getLanguageCookie } from './utils/cookies';
import {
  ReactFlow,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Panel,
  ReactFlowProvider,
  Connection,
  Edge,
  Node,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  Database, 
  Layers, 
  Route, 
  Cpu, 
  Settings, 
  Download, 
  Plus, 
  Trash2, 
  Save,
  Code,
  Box,
  Terminal,
  Github,
  Shield,
  Bug as Spider,
  Link as LinkIcon,
  Globe,
  Activity,
  Zap,
  Sun,
  Moon,
  Eye,
  X,
  FileCode,
  ChevronRight,
  Share2,
  Copy,
  Check,
  Layout,
  HelpCircle
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import '@scalar/api-reference-react/style.css';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
import { NodeType, Field, Language, Endpoint, Rule } from './types';

// --- Translations ---
const translations = {
  en: {
    title: "Arachnet",
    subtitle: "Visual Architecture Designer",
    components: "Components",
    model: "Data Model",
    controller: "Controller",
    service: "Service",
    route: "Route",
    database: "Database",
    auth: "Auth",
    middleware: "Middleware",
    projectSettings: "Project Settings",
    targetLanguage: "Target Language",
    generateCode: "Generate Code",
    saveProject: "Save Project",
    preview: "Preview Code",
    docs: "API Docs",
    close: "Close",
    loadingPreview: "Generating preview...",
    properties: "Properties",
    share: "Share Architecture",
    copyLink: "Copy Link",
    copied: "Copied!",
    examples: "Load Example",
    authExample: "Auth System",
    ecommerceExample: "E-commerce API",
    help: "Documentation",
    helpContent: {
      intro: "Welcome to Arachnet! The visual architecture tool for developers.",
      nodes: {
        title: "Components",
        model: "Data structure (Database tables/collections).",
        service: "Business logic and data processing.",
        controller: "Request handling and response logic.",
        route: "API endpoints and HTTP methods.",
        middleware: "Interceptors for auth, logging, etc."
      },
      features: {
        title: "Features",
        preview: "See the code generated in real-time.",
        docs: "Interactive API documentation with Scalar.",
        share: "Generate a link to share your architecture.",
        generate: "Download a complete project in your chosen language."
      }
    },
    label: "Label",
    connections: "Connections",
    connectToNode: "Connect to node...",
    fields: "Fields",
    addField: "Add Field",
    endpoints: "Endpoints",
    addEndpoint: "Add Endpoint",
    rules: "Rules",
    addRule: "Add Rule",
    selectComponent: "Select a component to edit its properties",
    liveEditor: "Live Editor",
    to: "To",
    from: "From",
    method: "Method",
    path: "Path",
    name: "Name",
    description: "Description"
  },
  pt: {
    title: "Arachnet",
    subtitle: "Designer de Arquitetura Visual",
    components: "Componentes",
    model: "Modelo de Dados",
    controller: "Controlador",
    service: "Serviço",
    route: "Rota",
    database: "Banco de Dados",
    auth: "Autenticação",
    middleware: "Middleware",
    projectSettings: "Configurações do Projeto",
    targetLanguage: "Linguagem Alvo",
    generateCode: "Gerar Código",
    saveProject: "Salvar Projeto",
    preview: "Visualizar Código",
    docs: "Docs da API",
    close: "Fechar",
    loadingPreview: "Gerando visualização...",
    properties: "Propriedades",
    share: "Compartilhar Arquitetura",
    copyLink: "Copiar Link",
    copied: "Copiado!",
    examples: "Carregar Exemplo",
    authExample: "Sistema de Autenticação",
    ecommerceExample: "API de E-commerce",
    help: "Documentação",
    helpContent: {
      intro: "Bem-vindo ao Arachnet! A ferramenta de arquitetura visual para desenvolvedores.",
      nodes: {
        title: "Componentes",
        model: "Estrutura de dados (Tabelas/Coleções de Banco).",
        service: "Lógica de negócio e processamento de dados.",
        controller: "Tratamento de requisições e lógica de resposta.",
        route: "Endpoints da API e métodos HTTP.",
        middleware: "Interceptadores para auth, logs, etc."
      },
      features: {
        title: "Funcionalidades",
        preview: "Veja o código gerado em tempo real.",
        docs: "Documentação interativa da API com Scalar.",
        share: "Gere um link para compartilhar sua arquitetura.",
        generate: "Baixe um projeto completo na linguagem escolhida."
      }
    },
    label: "Rótulo",
    connections: "Conexões",
    connectToNode: "Conectar ao nó...",
    fields: "Campos",
    addField: "Adicionar Campo",
    endpoints: "Endpoints",
    addEndpoint: "Adicionar Endpoint",
    rules: "Regras",
    addRule: "Adicionar Regra",
    selectComponent: "Selecione um componente para editar suas propriedades",
    liveEditor: "Editor em Tempo Real",
    to: "Para",
    from: "De",
    method: "Método",
    path: "Caminho",
    name: "Nome",
    description: "Descrição"
  }
};

// --- Components ---

const SidebarItem = ({ type, label, icon: Icon, theme }: { type: NodeType; label: string; icon: any; theme: 'dark' | 'light' }) => {
  const onDragStart = (event: React.DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 mb-2 border rounded-lg cursor-grab transition-colors group",
        theme === 'dark' 
          ? "bg-slate-800/50 border-slate-700 hover:bg-slate-700/50" 
          : "bg-slate-50 border-slate-200 hover:bg-slate-100"
      )}
      onDragStart={(event) => onDragStart(event, type)}
      draggable
    >
      <div className={cn(
        "p-2 rounded-md transition-colors",
        theme === 'dark' ? "bg-slate-900 group-hover:bg-blue-500/20 group-hover:text-blue-400" : "bg-white group-hover:bg-blue-50 group-hover:text-blue-600 shadow-sm"
      )}>
        <Icon size={18} />
      </div>
      <span className={cn(
        "text-sm font-medium transition-colors",
        theme === 'dark' ? "text-slate-300" : "text-slate-700"
      )}>{label}</span>
    </div>
  );
};

const PropertiesPanel = ({ 
  selectedNode, 
  nodes,
  edges,
  onUpdateNode, 
  onDeleteNode,
  onConnect,
  lang,
  theme
}: { 
  selectedNode: Node | null; 
  nodes: Node[];
  edges: Edge[];
  onUpdateNode: (id: string, data: any) => void;
  onDeleteNode: (id: string) => void;
  onConnect: (connection: Connection) => void;
  lang: Language;
  theme: 'dark' | 'light';
}) => {
  const t = translations[lang];

  if (!selectedNode) return (
    <div className={cn(
      "h-full flex flex-col items-center justify-center italic p-6 text-center transition-colors",
      theme === 'dark' ? "text-slate-500" : "text-slate-400"
    )}>
      <Settings size={48} className="mb-4 opacity-20" />
      {t.selectComponent}
    </div>
  );

  const data = selectedNode.data as any;
  const otherNodes = nodes.filter(n => n.id !== selectedNode.id);
  const connectedEdges = edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id);

  const inputClasses = cn(
    "w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors",
    theme === 'dark' ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"
  );

  const sectionHeaderClasses = cn(
    "block text-xs font-bold uppercase tracking-wider mb-1 transition-colors",
    theme === 'dark' ? "text-slate-500" : "text-slate-400"
  );

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full pb-20">
      <div className="flex items-center justify-between">
        <h3 className={cn(
          "text-lg font-display font-bold flex items-center gap-2 transition-colors",
          theme === 'dark' ? "text-white" : "text-slate-900"
        )}>
          <Settings size={18} className="text-blue-400" />
          {t.properties}
        </h3>
        <button 
          onClick={() => onDeleteNode(selectedNode.id)}
          className={cn(
            "p-2 rounded-md transition-colors",
            theme === 'dark' ? "text-slate-400 hover:text-red-400 hover:bg-red-400/10" : "text-slate-400 hover:text-red-600 hover:bg-red-50"
          )}
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className={sectionHeaderClasses}>{t.label}</label>
          <input 
            type="text" 
            value={data.label}
            onChange={(e) => onUpdateNode(selectedNode.id, { ...data, label: e.target.value })}
            className={inputClasses}
          />
        </div>

        {/* Connections Section */}
        <div className={cn("pt-4 border-t transition-colors", theme === 'dark' ? "border-slate-800" : "border-slate-100")}>
          <label className={cn(sectionHeaderClasses, "mb-3 flex items-center gap-2")}>
            <LinkIcon size={12} /> {t.connections}
          </label>
          <div className="space-y-3">
            <select 
              className={inputClasses}
              onChange={(e) => {
                if (e.target.value) {
                  onConnect({ 
                    source: selectedNode.id, 
                    target: e.target.value,
                    sourceHandle: null,
                    targetHandle: null
                  });
                  e.target.value = "";
                }
              }}
              defaultValue=""
            >
              <option value="" disabled>{t.connectToNode}</option>
              {otherNodes.map(n => (
                <option key={n.id} value={n.id}>{(n.data as any).label} ({n.type})</option>
              ))}
            </select>
            
            <div className="space-y-1">
              {connectedEdges.map(edge => {
                const targetNode = nodes.find(n => n.id === (edge.source === selectedNode.id ? edge.target : edge.source));
                return (
                  <div key={edge.id} className={cn(
                    "flex items-center justify-between text-[10px] px-2 py-1 rounded border transition-colors",
                    theme === 'dark' ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"
                  )}>
                    <span className={theme === 'dark' ? "text-slate-400" : "text-slate-500"}>
                      {edge.source === selectedNode.id ? t.to : t.from}: 
                      <span className={cn("font-medium", theme === 'dark' ? "text-white" : "text-slate-900")}>{(targetNode?.data as any)?.label}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Model Fields */}
        {selectedNode.type === 'model' && (
          <div className={cn("space-y-4 pt-4 border-t transition-colors", theme === 'dark' ? "border-slate-800" : "border-slate-100")}>
            <div className="flex items-center justify-between">
              <label className={sectionHeaderClasses}>{t.fields}</label>
              <button 
                onClick={() => {
                  const fields = [...(data.fields || []), { name: 'newField', type: 'String', required: false }];
                  onUpdateNode(selectedNode.id, { ...data, fields });
                }}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <Plus size={12} /> {t.addField}
              </button>
            </div>
            <div className="space-y-2">
              {(data.fields || []).map((field: Field, idx: number) => (
                <div key={idx} className={cn(
                  "grid grid-cols-2 gap-2 p-2 border rounded-md transition-colors",
                  theme === 'dark' ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-200"
                )}>
                  <input 
                    className={cn("bg-transparent text-xs focus:outline-none", theme === 'dark' ? "text-white" : "text-slate-900")}
                    value={field.name}
                    onChange={(e) => {
                      const fields = [...data.fields];
                      fields[idx].name = e.target.value;
                      onUpdateNode(selectedNode.id, { ...data, fields });
                    }}
                  />
                  <select 
                    className={cn("bg-transparent text-xs focus:outline-none", theme === 'dark' ? "text-slate-400" : "text-slate-500")}
                    value={field.type}
                    onChange={(e) => {
                      const fields = [...data.fields];
                      fields[idx].type = e.target.value;
                      onUpdateNode(selectedNode.id, { ...data, fields });
                    }}
                  >
                    <option value="String">String</option>
                    <option value="Number">Number</option>
                    <option value="Boolean">Boolean</option>
                    <option value="Date">Date</option>
                    <option value="ObjectId">ObjectId</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Service/Controller Rules */}
        {(selectedNode.type === 'service' || selectedNode.type === 'controller') && (
          <div className={cn("space-y-4 pt-4 border-t transition-colors", theme === 'dark' ? "border-slate-800" : "border-slate-100")}>
            <div className="flex items-center justify-between">
              <label className={sectionHeaderClasses}>{t.rules}</label>
              <button 
                onClick={() => {
                  const rules = [...(data.rules || []), { name: 'newRule', description: '' }];
                  onUpdateNode(selectedNode.id, { ...data, rules });
                }}
                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                <Plus size={12} /> {t.addRule}
              </button>
            </div>
            <div className="space-y-2">
              {(data.rules || []).map((rule: Rule, idx: number) => (
                <div key={idx} className={cn(
                  "p-2 border rounded-md space-y-2 transition-colors",
                  theme === 'dark' ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-200"
                )}>
                  <input 
                    placeholder={t.name}
                    className={cn(
                      "w-full bg-transparent text-xs focus:outline-none border-b pb-1 transition-colors",
                      theme === 'dark' ? "text-white border-slate-700" : "text-slate-900 border-slate-200"
                    )}
                    value={rule.name}
                    onChange={(e) => {
                      const rules = [...data.rules];
                      rules[idx].name = e.target.value;
                      onUpdateNode(selectedNode.id, { ...data, rules });
                    }}
                  />
                  <textarea 
                    placeholder={t.description}
                    className={cn(
                      "w-full bg-transparent text-[10px] focus:outline-none resize-none h-12 transition-colors",
                      theme === 'dark' ? "text-slate-400" : "text-slate-500"
                    )}
                    value={rule.description}
                    onChange={(e) => {
                      const rules = [...data.rules];
                      rules[idx].description = e.target.value;
                      onUpdateNode(selectedNode.id, { ...data, rules });
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Route Endpoints */}
        {selectedNode.type === 'route' && (
          <div className={cn("space-y-4 pt-4 border-t transition-colors", theme === 'dark' ? "border-slate-800" : "border-slate-100")}>
            <div className="flex items-center justify-between">
              <label className={sectionHeaderClasses}>{t.endpoints}</label>
              <button 
                onClick={() => {
                  const endpoints = [...(data.endpoints || []), { name: 'getUsers', method: 'GET', path: '/users' }];
                  onUpdateNode(selectedNode.id, { ...data, endpoints });
                }}
                className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1"
              >
                <Plus size={12} /> {t.addEndpoint}
              </button>
            </div>
            <div className="space-y-2">
              {(data.endpoints || []).map((ep: Endpoint, idx: number) => (
                <div key={idx} className={cn(
                  "p-2 border rounded-md space-y-2 transition-colors",
                  theme === 'dark' ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-200"
                )}>
                  <div className="flex gap-2">
                    <select 
                      className={cn(
                        "text-[10px] font-bold rounded px-1 focus:outline-none transition-colors",
                        theme === 'dark' ? "bg-slate-800 text-orange-400" : "bg-white text-orange-600 border border-slate-200"
                      )}
                      value={ep.method}
                      onChange={(e) => {
                        const endpoints = [...data.endpoints];
                        endpoints[idx].method = e.target.value as any;
                        onUpdateNode(selectedNode.id, { ...data, endpoints });
                      }}
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="DELETE">DELETE</option>
                    </select>
                    <input 
                      placeholder={t.path}
                      className={cn(
                        "flex-1 bg-transparent text-xs focus:outline-none border-b transition-colors",
                        theme === 'dark' ? "text-white border-slate-700" : "text-slate-900 border-slate-200"
                      )}
                      value={ep.path}
                      onChange={(e) => {
                        const endpoints = [...data.endpoints];
                        endpoints[idx].path = e.target.value;
                        onUpdateNode(selectedNode.id, { ...data, endpoints });
                      }}
                    />
                  </div>
                  <input 
                    placeholder={t.name}
                    className={cn(
                      "w-full bg-transparent text-[10px] focus:outline-none transition-colors",
                      theme === 'dark' ? "text-slate-400" : "text-slate-500"
                    )}
                    value={ep.name}
                    onChange={(e) => {
                      const endpoints = [...data.endpoints];
                      endpoints[idx].name = e.target.value;
                      onUpdateNode(selectedNode.id, { ...data, endpoints });
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Node Components ---

const ModelNode = ({ data }: any) => (
  <div className="bg-[var(--bg-node)] border-2 border-blue-500/50 rounded-lg p-4 shadow-xl min-w-[180px] relative transition-colors">
    <Handle type="target" position={Position.Top} className="!bg-blue-500 !w-3 !h-3" />
    <div className="flex items-center gap-2 mb-3 border-b border-[var(--border-node)] pb-2">
      <Box size={16} className="text-blue-500 dark:text-blue-400" />
      <span className="font-bold text-sm text-[var(--text-node-title)]">{data.label}</span>
    </div>
    <div className="space-y-1">
      {data.fields?.map((f: any, i: number) => (
        <div key={i} className="flex justify-between text-[10px] text-[var(--text-node-body)] font-mono">
          <span>{f.name}</span>
          <span className="opacity-60">{f.type}</span>
        </div>
      ))}
      {(!data.fields || data.fields.length === 0) && (
        <div className="text-[10px] text-[var(--text-node-body)] opacity-40 italic">No fields defined</div>
      )}
    </div>
    <Handle type="source" position={Position.Bottom} className="!bg-blue-500 !w-3 !h-3" />
  </div>
);

const GenericNode = ({ data, icon: Icon, colorClass }: any) => (
  <div className={cn(
    "bg-[var(--bg-node)] border-2 rounded-lg p-4 shadow-xl min-w-[180px] relative transition-colors",
    colorClass
  )}>
    <Handle type="target" position={Position.Top} className="!w-3 !h-3" />
    <div className="flex items-center gap-2 mb-2">
      <Icon size={16} />
      <span className="font-bold text-sm text-[var(--text-node-title)]">{data.label}</span>
    </div>
    
    {/* Visual indicators for rules/endpoints */}
    <div className="space-y-1 mt-2">
      {data.rules?.slice(0, 2).map((r: any, i: number) => (
        <div key={i} className="flex items-center gap-1 text-[8px] text-[var(--text-node-body)]">
          <Zap size={8} /> {r.name}
        </div>
      ))}
      {data.endpoints?.slice(0, 2).map((e: any, i: number) => (
        <div key={i} className="flex items-center gap-1 text-[8px] text-[var(--text-node-body)]">
          <Activity size={8} /> {e.method} {e.path}
        </div>
      ))}
    </div>
    
    <Handle type="source" position={Position.Bottom} className="!w-3 !h-3" />
  </div>
);

const nodeTypes = {
  model: ModelNode,
  controller: (props: any) => <GenericNode {...props} icon={Cpu} colorClass="border-emerald-500/50 text-emerald-400" />,
  service: (props: any) => <GenericNode {...props} icon={Layers} colorClass="border-purple-500/50 text-purple-400" />,
  route: (props: any) => <GenericNode {...props} icon={Route} colorClass="border-orange-500/50 text-orange-400" />,
  database: (props: any) => <GenericNode {...props} icon={Database} colorClass="border-cyan-500/50 text-cyan-400" />,
  auth: (props: any) => <GenericNode {...props} icon={Shield} colorClass="border-red-500/50 text-red-400" />,
  middleware: (props: any) => <GenericNode {...props} icon={Terminal} colorClass="border-yellow-500/50 text-yellow-400" />,
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'model',
    data: { label: 'User', fields: [{ name: 'email', type: 'String', required: true }] },
    position: { x: 250, y: 50 },
  },
];

const initialEdges: Edge[] = [];

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [language, setLanguage] = useState<'node' | 'python' | 'go' | 'java' | 'csharp'>('node');
  const [lang, setLang] = useState<Language>(() => {
    const savedLanguage = getLanguageCookie();
    return savedLanguage || 'en';
  });
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const savedTheme = getThemeCookie();
    return savedTheme || 'dark';
  });
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<Record<string, string>>({});
  const [selectedPreviewFile, setSelectedPreviewFile] = useState<string | null>(null);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [openApiSpec, setOpenApiSpec] = useState<any>(null);
  const [isShared, setIsShared] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  
  const t = translations[lang];
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('project');
    if (projectId) {
      fetch(`/api/projects/${projectId}`)
        .then(res => res.json())
        .then(data => {
          if (data.graph_data) {
            setNodes(data.graph_data.nodes || []);
            setEdges(data.graph_data.edges || []);
          }
        })
        .catch(err => console.error("Failed to load project", err));
    }
  }, []);

  // Salvar tema no cookie quando alterado
  useEffect(() => {
    setThemeCookie(theme);
  }, [theme]);

  // Salvar idioma no cookie quando alterado
  useEffect(() => {
    setLanguageCookie(lang);
  }, [lang]);

  const handleShare = async () => {
    const id = Math.random().toString(36).substring(2, 11);
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          name: 'Shared Project',
          graphData: { nodes, edges }
        })
      });

      if (response.ok) {
        const shareUrl = `${window.location.origin}${window.location.pathname}?project=${id}`;
        await navigator.clipboard.writeText(shareUrl);
        setIsShared(true);
        setTimeout(() => setIsShared(false), 2000);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const loadExample = (type: 'auth' | 'ecommerce') => {
    if (type === 'auth') {
      const exampleNodes: any[] = [
        { id: '1', type: 'model', position: { x: 100, y: 100 }, data: { label: 'User', fields: [{ name: 'email', type: 'String', required: true }, { name: 'password', type: 'String', required: true }] } },
        { id: '2', type: 'service', position: { x: 400, y: 100 }, data: { label: 'AuthService', rules: [{ name: 'Register', description: 'Create new user' }, { name: 'Login', description: 'Authenticate user' }] } },
        { id: '3', type: 'controller', position: { x: 700, y: 100 }, data: { label: 'AuthController', rules: [{ name: 'handleRegister', description: 'Call AuthService.Register' }] } },
        { id: '4', type: 'route', position: { x: 1000, y: 100 }, data: { label: 'AuthRoutes', endpoints: [{ method: 'POST', path: '/register', name: 'Register' }, { method: 'POST', path: '/login', name: 'Login' }] } },
      ];
      const exampleEdges: any[] = [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e2-3', source: '2', target: '3' },
        { id: 'e3-4', source: '3', target: '4' },
      ];
      setNodes(exampleNodes);
      setEdges(exampleEdges);
    } else if (type === 'ecommerce') {
      const exampleNodes: any[] = [
        { id: '1', type: 'model', position: { x: 100, y: 100 }, data: { label: 'Product', fields: [{ name: 'name', type: 'String', required: true }, { name: 'price', type: 'Number', required: true }] } },
        { id: '2', type: 'model', position: { x: 100, y: 300 }, data: { label: 'Order', fields: [{ name: 'total', type: 'Number', required: true }] } },
        { id: '3', type: 'service', position: { x: 400, y: 200 }, data: { label: 'StoreService', rules: [{ name: 'CreateOrder', description: 'Process checkout' }] } },
        { id: '4', type: 'controller', position: { x: 700, y: 200 }, data: { label: 'StoreController' } },
        { id: '5', type: 'route', position: { x: 1000, y: 200 }, data: { label: 'StoreRoutes', endpoints: [{ method: 'GET', path: '/products', name: 'ListProducts' }, { method: 'POST', path: '/checkout', name: 'Checkout' }] } },
      ];
      const exampleEdges: any[] = [
        { id: 'e1-3', source: '1', target: '3' },
        { id: 'e2-3', source: '2', target: '3' },
        { id: 'e3-4', source: '3', target: '4' },
        { id: 'e4-5', source: '4', target: '5' },
      ];
      setNodes(exampleNodes);
      setEdges(exampleEdges);
    }
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow') as NodeType;

      if (!type) return;

      const position = { x: event.clientX - 400, y: event.clientY - 100 };
      const newNode: Node = {
        id: Math.random().toString(36).substr(2, 9),
        type,
        position,
        data: { label: `${type.charAt(0).toUpperCase() + type.slice(1)}`, fields: [], rules: [], endpoints: [] },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const onNodeClick = (_: any, node: Node) => {
    setSelectedNodeId(node.id);
  };

  const onUpdateNode = (id: string, data: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return { ...node, data };
        }
        return node;
      })
    );
  };

  const onDeleteNode = (id: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    setSelectedNodeId(null);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          graph: { nodes, edges },
          language,
          projectName: 'arachnet-api'
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'arachnet-project.zip';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreview = async () => {
    setIsPreviewLoading(true);
    setIsPreviewOpen(true);
    try {
      const response = await fetch('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          graph: { nodes, edges },
          language
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPreviewFiles(data.files);
        const firstFile = Object.keys(data.files)[0];
        setSelectedPreviewFile(firstFile || null);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleDocs = async () => {
    setIsDocsOpen(true);
    try {
      const response = await fetch('/api/openapi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          graph: { nodes, edges }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setOpenApiSpec(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  return (
    <div className={cn(
      "flex h-screen w-screen font-sans overflow-hidden transition-colors duration-300",
      theme === 'dark' ? "bg-slate-950 text-slate-200 dark" : "bg-slate-50 text-slate-900 light"
    )}>
      {/* Sidebar */}
      <aside className={cn(
        "w-72 border-r flex flex-col z-10 transition-colors duration-300",
        theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
      )}>
        <div className={cn(
          "p-6 border-b transition-colors duration-300",
          theme === 'dark' ? "border-slate-800" : "border-slate-200"
        )}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
                <Spider className="text-white" size={24} />
              </div>
              <h1 className={cn(
                "text-xl font-display font-bold tracking-tight transition-colors",
                theme === 'dark' ? "text-white" : "text-slate-900"
              )}>{t.title}</h1>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Help Button */}
              <button 
                onClick={() => setIsHelpOpen(true)}
                className={cn(
                  "p-2 rounded-full border transition-colors",
                  theme === 'dark' ? "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-400" : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-500"
                )}
                title={t.help}
              >
                <HelpCircle size={16} />
              </button>

              {/* Theme Toggle */}
              <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={cn(
                  "p-2 rounded-full border transition-colors",
                  theme === 'dark' ? "bg-slate-800 hover:bg-slate-700 border-slate-700 text-yellow-400" : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600"
                )}
                title={theme === 'dark' ? "Light Mode" : "Dark Mode"}
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>

              {/* Language Toggle */}
              <button 
                onClick={() => setLang(lang === 'en' ? 'pt' : 'en')}
                className={cn(
                  "p-2 rounded-full border transition-colors",
                  theme === 'dark' ? "bg-slate-800 hover:bg-slate-700 border-slate-700 text-blue-400" : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-blue-600"
                )}
                title={lang === 'en' ? "Mudar para Português" : "Switch to English"}
              >
                <Globe size={16} />
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-500 font-medium">{t.subtitle}</p>
        </div>

        <div className={cn(
          "flex-1 overflow-y-auto p-4 transition-colors duration-300",
          theme === 'dark' ? "bg-slate-900" : "bg-white"
        )}>
          <div className="mb-6">
            <h2 className={cn(
              "text-[10px] font-bold uppercase tracking-widest mb-4 transition-colors",
              theme === 'dark' ? "text-slate-500" : "text-slate-400"
            )}>{t.components}</h2>
            <SidebarItem type="model" label={t.model} icon={Box} theme={theme} />
            <SidebarItem type="controller" label={t.controller} icon={Cpu} theme={theme} />
            <SidebarItem type="service" label={t.service} icon={Layers} theme={theme} />
            <SidebarItem type="route" label={t.route} icon={Route} theme={theme} />
            <SidebarItem type="database" label={t.database} icon={Database} theme={theme} />
            <SidebarItem type="auth" label={t.auth} icon={Shield} theme={theme} />
            <SidebarItem type="middleware" label={t.middleware} icon={Terminal} theme={theme} />
          </div>

          <div className={cn("pt-4 border-t transition-colors", theme === 'dark' ? "border-slate-800" : "border-slate-100")}>
            <h2 className={cn(
              "text-[10px] font-bold uppercase tracking-widest mb-4 transition-colors",
              theme === 'dark' ? "text-slate-500" : "text-slate-400"
            )}>{t.projectSettings}</h2>
            <div className="space-y-3">
              <label className={cn(
                "block text-xs transition-colors",
                theme === 'dark' ? "text-slate-400" : "text-slate-500"
              )}>{t.targetLanguage}</label>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setLanguage('node')}
                  className={cn(
                    "px-3 py-2 rounded-md text-[10px] font-medium border transition-all",
                    language === 'node' 
                      ? "bg-blue-500/10 border-blue-500 text-blue-400" 
                      : (theme === 'dark' ? "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600" : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300")
                  )}
                >
                  Node.js
                </button>
                <button 
                  onClick={() => setLanguage('python')}
                  className={cn(
                    "px-3 py-2 rounded-md text-[10px] font-medium border transition-all",
                    language === 'python' 
                      ? "bg-blue-500/10 border-blue-500 text-blue-400" 
                      : (theme === 'dark' ? "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600" : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300")
                  )}
                >
                  Python
                </button>
                <button 
                  onClick={() => setLanguage('go')}
                  className={cn(
                    "px-3 py-2 rounded-md text-[10px] font-medium border transition-all",
                    language === 'go' 
                      ? "bg-blue-500/10 border-blue-500 text-blue-400" 
                      : (theme === 'dark' ? "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600" : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300")
                  )}
                >
                  Go
                </button>
                <button 
                  onClick={() => setLanguage('java')}
                  className={cn(
                    "px-3 py-2 rounded-md text-[10px] font-medium border transition-all",
                    language === 'java' 
                      ? "bg-blue-500/10 border-blue-500 text-blue-400" 
                      : (theme === 'dark' ? "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600" : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300")
                  )}
                >
                  Java
                </button>
                <button 
                  onClick={() => setLanguage('csharp')}
                  className={cn(
                    "px-3 py-2 rounded-md text-[10px] font-medium border transition-all col-span-2",
                    language === 'csharp' 
                      ? "bg-blue-500/10 border-blue-500 text-blue-400" 
                      : (theme === 'dark' ? "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600" : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300")
                  )}
                >
                  C# (.NET EF)
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className={cn(
          "p-4 border-t space-y-2 transition-colors duration-300",
          theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        )}>
          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-blue-600/20 active:scale-95"
          >
            {isGenerating ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
            ) : (
              <Code size={18} />
            )}
            {t.generateCode}
          </button>
          <button 
            onClick={handlePreview}
            className={cn(
              "w-full flex items-center justify-center gap-2 font-medium py-2 rounded-lg transition-all border",
              theme === 'dark' ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700" : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
            )}
          >
            <Eye size={16} />
            {t.preview}
          </button>
          <button 
            onClick={handleDocs}
            className={cn(
              "w-full flex items-center justify-center gap-2 font-medium py-2 rounded-lg transition-all border",
              theme === 'dark' ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700" : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
            )}
          >
            <FileCode size={16} />
            {t.docs}
          </button>
          <button 
            onClick={handleShare}
            className={cn(
              "w-full flex items-center justify-center gap-2 font-medium py-2 rounded-lg transition-all border",
              isShared ? "bg-emerald-600 border-emerald-500 text-white" : (theme === 'dark' ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700" : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200")
            )}
          >
            {isShared ? <Check size={16} /> : <Share2 size={16} />}
            {isShared ? t.copied : t.share}
          </button>
          
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest px-1">{t.examples}</p>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => loadExample('auth')}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-lg border text-[10px] transition-all",
                  theme === 'dark' ? "bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-400" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
                )}
              >
                <Layout size={14} className="text-blue-500" />
                {t.authExample}
              </button>
              <button 
                onClick={() => loadExample('ecommerce')}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-lg border text-[10px] transition-all",
                  theme === 'dark' ? "bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-400" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
                )}
              >
                <Layout size={14} className="text-emerald-500" />
                {t.ecommerceExample}
              </button>
            </div>
          </div>
          
          <button className={cn(
            "w-full flex items-center justify-center gap-2 font-medium py-2 rounded-lg transition-all border",
            theme === 'dark' ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700" : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
          )}>
            <Save size={16} />
            {t.saveProject}
          </button>
        </div>
      </aside>

      {/* Main Canvas */}
      <main className={cn(
        "flex-1 relative transition-colors duration-300",
        theme === 'dark' ? "bg-slate-950" : "bg-slate-50"
      )} ref={reactFlowWrapper}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid
            snapGrid={[15, 15]}
            colorMode={theme}
          >
            <Background color={theme === 'dark' ? "#1e293b" : "#e2e8f0"} gap={20} />
            <Controls />
            <MiniMap 
              style={{ 
                backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff', 
                border: theme === 'dark' ? '1px solid #1e293b' : '1px solid #e2e8f0' 
              }}
              nodeColor={(n) => {
                if (n.type === 'model') return '#3b82f6';
                if (n.type === 'controller') return '#10b981';
                if (n.type === 'service') return '#a855f7';
                return theme === 'dark' ? '#475569' : '#94a3b8';
              }}
              maskColor={theme === 'dark' ? "rgba(15, 23, 42, 0.7)" : "rgba(255, 255, 255, 0.7)"}
            />
            <Panel position="top-right" className={cn(
              "backdrop-blur-md border p-2 rounded-lg flex items-center gap-4 shadow-2xl transition-colors duration-300",
              theme === 'dark' ? "bg-slate-900/80 border-slate-800" : "bg-white/80 border-slate-200"
            )}>
              <div className={cn(
                "flex items-center gap-2 px-2 border-r transition-colors",
                theme === 'dark' ? "border-slate-800" : "border-slate-200"
              )}>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-widest transition-colors",
                  theme === 'dark' ? "text-slate-400" : "text-slate-500"
                )}>{t.liveEditor}</span>
              </div>
              <div className="flex items-center gap-2">
                <button className={cn(
                  "p-2 transition-colors",
                  theme === 'dark' ? "text-slate-400 hover:text-white" : "text-slate-400 hover:text-slate-900"
                )}>
                  <Github size={18} />
                </button>
                <button className={cn(
                  "p-2 transition-colors",
                  theme === 'dark' ? "text-slate-400 hover:text-white" : "text-slate-400 hover:text-slate-900"
                )}>
                  <Download size={18} />
                </button>
              </div>
            </Panel>
          </ReactFlow>
        </ReactFlowProvider>
      </main>

      {/* Properties Panel */}
      <aside className={cn(
        "w-80 border-l z-10 transition-colors duration-300",
        theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
      )}>
        <PropertiesPanel 
          selectedNode={selectedNode} 
          nodes={nodes}
          edges={edges}
          onUpdateNode={onUpdateNode}
          onDeleteNode={onDeleteNode}
          onConnect={onConnect}
          lang={lang}
          theme={theme}
        />
      </aside>

      {/* Code Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-10 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className={cn(
            "w-full max-w-6xl h-full max-h-[800px] rounded-2xl shadow-2xl flex flex-col overflow-hidden border animate-in zoom-in-95 duration-300",
            theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
          )}>
            {/* Modal Header */}
            <div className={cn(
              "px-6 py-4 border-b flex items-center justify-between",
              theme === 'dark' ? "border-slate-800" : "border-slate-200"
            )}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Code size={20} className="text-white" />
                </div>
                <div>
                  <h2 className={cn("font-bold", theme === 'dark' ? "text-white" : "text-slate-900")}>{t.preview}</h2>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">{language.toUpperCase()} Project</p>
                </div>
              </div>
              <button 
                onClick={() => setIsPreviewOpen(false)}
                className={cn(
                  "p-2 rounded-full transition-colors",
                  theme === 'dark' ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"
                )}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 flex overflow-hidden">
              {isPreviewLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-6">
                  <div className="relative">
                    <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center animate-bounce shadow-xl shadow-blue-500/40">
                      <Spider size={40} className="text-white" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full border-4 border-slate-900 flex items-center justify-center animate-pulse">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className={cn("font-medium mb-1", theme === 'dark' ? "text-white" : "text-slate-900")}>{t.loadingPreview}</p>
                    <p className="text-xs text-slate-500">Building your architecture...</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* File List */}
                  <div className={cn(
                    "w-72 border-r overflow-y-auto p-4 space-y-1",
                    theme === 'dark' ? "bg-slate-950/50 border-slate-800" : "bg-slate-50 border-slate-200"
                  )}>
                    {Object.keys(previewFiles).sort().map(filePath => (
                      <button
                        key={filePath}
                        onClick={() => setSelectedPreviewFile(filePath)}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs transition-all group",
                          selectedPreviewFile === filePath
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                            : (theme === 'dark' ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200" : "text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm")
                        )}
                      >
                        <FileCode size={14} className={selectedPreviewFile === filePath ? "text-white" : "text-blue-500"} />
                        <span className="truncate flex-1">{filePath}</span>
                        <ChevronRight size={12} className={cn(
                          "transition-transform",
                          selectedPreviewFile === filePath ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                        )} />
                      </button>
                    ))}
                  </div>

                  {/* Code Viewer */}
                  <div className={cn(
                    "flex-1 overflow-auto p-6 font-mono text-sm",
                    theme === 'dark' ? "bg-slate-950" : "bg-white"
                  )}>
                    {selectedPreviewFile && (
                      <pre className={cn(
                        "transition-colors",
                        theme === 'dark' ? "text-blue-400" : "text-blue-700"
                      )}>
                        <code>{previewFiles[selectedPreviewFile]}</code>
                      </pre>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className={cn(
              "px-6 py-4 border-t flex justify-end gap-3",
              theme === 'dark' ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-200"
            )}>
              <button 
                onClick={() => setIsPreviewOpen(false)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  theme === 'dark' ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                {t.close}
              </button>
              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95"
              >
                {t.generateCode}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Docs Modal */}
      {isDocsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-10 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className={cn(
            "w-full max-w-7xl h-full rounded-2xl shadow-2xl flex flex-col overflow-hidden border animate-in zoom-in-95 duration-300",
            theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
          )}>
            <div className={cn(
              "px-6 py-4 border-b flex items-center justify-between",
              theme === 'dark' ? "border-slate-800" : "border-slate-200"
            )}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-600 rounded-lg">
                  <FileCode size={20} className="text-white" />
                </div>
                <h2 className={cn("font-bold", theme === 'dark' ? "text-white" : "text-slate-900")}>{t.docs}</h2>
              </div>
              <button 
                onClick={() => setIsDocsOpen(false)}
                className={cn(
                  "p-2 rounded-full transition-colors",
                  theme === 'dark' ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"
                )}
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {openApiSpec ? (
                <iframe
                  srcDoc={`
                    <!doctype html>
                    <html>
                      <head>
                        <title>Scalar API Reference</title>
                        <meta charset="utf-8" />
                        <meta name="viewport" content="width=device-width, initial-scale=1" />
                        <style>
                          body { margin: 0; }
                        </style>
                      </head>
                      <body>
                        <script
                          id="api-reference"
                          data-url="data:application/json;base64,${btoa(JSON.stringify(openApiSpec))}"
                          data-configuration='{"theme": "${theme === 'dark' ? 'moon' : 'default'}"}'
                        ></script>
                        <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
                      </body>
                    </html>
                  `}
                  className="w-full h-full border-none"
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-10 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className={cn(
            "w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden border animate-in zoom-in-95 duration-300",
            theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
          )}>
            <div className={cn(
              "px-6 py-4 border-b flex items-center justify-between",
              theme === 'dark' ? "border-slate-800" : "border-slate-200"
            )}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <HelpCircle size={20} className="text-white" />
                </div>
                <h2 className={cn("font-bold", theme === 'dark' ? "text-white" : "text-slate-900")}>{t.help}</h2>
              </div>
              <button 
                onClick={() => setIsHelpOpen(false)}
                className={cn(
                  "p-2 rounded-full transition-colors",
                  theme === 'dark' ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"
                )}
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-8 space-y-8">
              <p className={cn("text-lg", theme === 'dark' ? "text-slate-300" : "text-slate-600")}>
                {t.helpContent.intro}
              </p>

              <section className="space-y-4">
                <h3 className={cn("text-sm font-bold uppercase tracking-widest", theme === 'dark' ? "text-blue-400" : "text-blue-600")}>
                  {t.helpContent.nodes.title}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { icon: Box, label: 'Model', color: 'text-blue-500', desc: t.helpContent.nodes.model },
                    { icon: Cpu, label: 'Service', color: 'text-purple-500', desc: t.helpContent.nodes.service },
                    { icon: Settings, label: 'Controller', color: 'text-emerald-500', desc: t.helpContent.nodes.controller },
                    { icon: Route, label: 'Route', color: 'text-orange-500', desc: t.helpContent.nodes.route },
                    { icon: Terminal, label: 'Middleware', color: 'text-yellow-500', desc: t.helpContent.nodes.middleware },
                  ].map((item, i) => (
                    <div key={i} className={cn(
                      "p-4 rounded-xl border flex flex-col gap-2",
                      theme === 'dark' ? "bg-slate-950/50 border-slate-800" : "bg-slate-50 border-slate-200"
                    )}>
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <item.icon size={16} className={item.color} />
                        <span className={theme === 'dark' ? "text-white" : "text-slate-900"}>{item.label}</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                <h3 className={cn("text-sm font-bold uppercase tracking-widest", theme === 'dark' ? "text-emerald-400" : "text-emerald-600")}>
                  {t.helpContent.features.title}
                </h3>
                <div className="space-y-3">
                  {[
                    { icon: Eye, label: t.preview, desc: t.helpContent.features.preview },
                    { icon: FileCode, label: t.docs, desc: t.helpContent.features.docs },
                    { icon: Share2, label: t.share, desc: t.helpContent.features.share },
                    { icon: Download, label: t.generateCode, desc: t.helpContent.features.generate },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className={cn(
                        "p-2 rounded-lg",
                        theme === 'dark' ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"
                      )}>
                        <item.icon size={18} />
                      </div>
                      <div>
                        <h4 className={cn("font-bold text-sm", theme === 'dark' ? "text-white" : "text-slate-900")}>{item.label}</h4>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
            <div className={cn(
              "px-6 py-4 border-t flex justify-end",
              theme === 'dark' ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-200"
            )}>
              <button 
                onClick={() => setIsHelpOpen(false)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



