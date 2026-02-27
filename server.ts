import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import JSZip from "jszip";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("backend_canvas.db");

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    graph_data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/projects", (req, res) => {
    const { id, name, graphData } = req.body;
    const stmt = db.prepare("INSERT OR REPLACE INTO projects (id, name, graph_data) VALUES (?, ?, ?)");
    stmt.run(id, name, JSON.stringify(graphData));
    res.json({ success: true });
  });

  app.get("/api/projects/:id", (req, res) => {
    const stmt = db.prepare("SELECT * FROM projects WHERE id = ?");
    const project = stmt.get(req.params.id);
    if (project) {
      res.json({ ...project, graph_data: JSON.parse(project.graph_data as string) });
    } else {
      res.status(404).json({ error: "Project not found" });
    }
  });

  // Code Generation Endpoint
  app.post("/api/generate", async (req, res) => {
    const { graph, language, projectName } = req.body;
    
    try {
      const zip = new JSZip();
      const folder = zip.folder(projectName || "arachnet-project");

      if (language === "node") {
        generateNodeProject(folder!, graph);
      } else if (language === "python") {
        generatePythonProject(folder!, graph);
      } else if (language === "go") {
        generateGoProject(folder!, graph);
      } else if (language === "java") {
        generateJavaProject(folder!, graph);
      } else if (language === "csharp") {
        generateCSharpProject(folder!, graph);
      }

      const content = await zip.generateAsync({ type: "nodebuffer" });
      res.set("Content-Type", "application/zip");
      res.set("Content-Disposition", `attachment; filename=${projectName || "arachnet-project"}.zip`);
      res.send(content);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to generate code" });
    }
  });

  app.post("/api/preview", async (req, res) => {
    const { graph, language } = req.body;
    try {
      const zip = new JSZip();
      const folder = zip.folder("preview");

      if (language === "node") {
        generateNodeProject(folder!, graph);
      } else if (language === "python") {
        generatePythonProject(folder!, graph);
      } else if (language === "go") {
        generateGoProject(folder!, graph);
      } else if (language === "java") {
        generateJavaProject(folder!, graph);
      } else if (language === "csharp") {
        generateCSharpProject(folder!, graph);
      }

      const files: Record<string, string> = {};
      const promises: Promise<void>[] = [];
      
      zip.folder("preview")?.forEach((relativePath, file) => {
        if (!file.dir) {
          promises.push(
            file.async("string").then(content => {
              files[relativePath] = content;
            })
          );
        }
      });

      await Promise.all(promises);
      res.json({ files });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to generate preview" });
    }
  });

  app.post("/api/openapi", (req, res) => {
    try {
      const { graph } = req.body;
      const spec = generateOpenApiSpec(graph);
      res.json(spec);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to generate OpenAPI spec" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Helper to get connected nodes
function getConnectedNodes(nodeId: string, edges: any[], nodes: any[], type?: string) {
  const connectedIds = edges
    .filter(e => e.source === nodeId || e.target === nodeId)
    .map(e => e.source === nodeId ? e.target : e.source);
  
  const connected = nodes.filter(n => connectedIds.includes(n.id));
  return type ? connected.filter(n => n.type === type) : connected;
}

// Helper to generate OpenAPI Spec
function generateOpenApiSpec(graph: any) {
  const { nodes } = graph;
  const spec: any = {
    openapi: "3.0.0",
    info: {
      title: "Arachnet Generated API",
      version: "1.0.0",
      description: "API documentation generated by Arachnet"
    },
    paths: {},
    components: {
      schemas: {}
    }
  };

  nodes.forEach((node: any) => {
    if (node.type === 'model') {
      const name = node.data.label;
      const properties: any = {};
      const required: string[] = [];

      (node.data.fields || []).forEach((f: any) => {
        properties[f.name] = {
          type: f.type === 'Number' ? 'number' : f.type === 'Boolean' ? 'boolean' : 'string'
        };
        if (f.required) required.push(f.name);
      });

      spec.components.schemas[name] = {
        type: "object",
        properties,
        ...(required.length > 0 ? { required } : {})
      };
    }

    if (node.type === 'route') {
      const endpoints = node.data.endpoints || [];
      endpoints.forEach((ep: any) => {
        const path = ep.path.startsWith('/') ? ep.path : `/${ep.path}`;
        if (!spec.paths[path]) spec.paths[path] = {};
        
        spec.paths[path][ep.method.toLowerCase()] = {
          summary: ep.name,
          responses: {
            "200": {
              description: "Successful response",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" }
                    }
                  }
                }
              }
            }
          }
        };
      });
    }
  });

  return spec;
}

// Simple Node.js project generator
function generateNodeProject(folder: JSZip, graph: any) {
  const { nodes, edges } = graph;
  
  const openApiSpec = generateOpenApiSpec(graph);
  folder.file("openapi.json", JSON.stringify(openApiSpec, null, 2));
  
  folder.file("package.json", JSON.stringify({
    name: "arachnet-api",
    version: "1.0.0",
    main: "index.js",
    scripts: { start: "node index.js", dev: "nodemon index.js" },
    dependencies: { 
      express: "^4.18.2", 
      dotenv: "^16.0.3", 
      mongoose: "^7.0.0", 
      cors: "^2.8.5",
      "swagger-ui-express": "^5.0.0"
    }
  }, null, 2));

  folder.file(".env", "PORT=3000\nMONGO_URI=mongodb://localhost:27017/arachnetdb");

  let indexContent = `const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./openapi.json');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/', (req, res) => res.send('Arachnet API Running. Docs at /api-docs'));

app.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));
`;
  folder.file("index.js", indexContent);

  const modelsFolder = folder.folder("models");
  const servicesFolder = folder.folder("services");
  const controllersFolder = folder.folder("controllers");
  const routesFolder = folder.folder("routes");

  nodes.forEach((node: any) => {
    const name = node.data.label;
    const fileName = name.toLowerCase();

    if (node.type === 'model') {
      const fields = node.data.fields || [];
      let content = `const mongoose = require('mongoose');\n\nconst ${name}Schema = new mongoose.Schema({\n`;
      fields.forEach((f: any) => {
        content += `  ${f.name}: { type: ${f.type === 'String' ? 'String' : f.type === 'Number' ? 'Number' : 'mongoose.Schema.Types.Mixed'}, required: ${f.required} },\n`;
      });
      content += `}, { timestamps: true });\n\nmodule.exports = mongoose.model('${name}', ${name}Schema);`;
      modelsFolder?.file(`${fileName}.model.js`, content);
    }

    if (node.type === 'service') {
      const connectedModels = getConnectedNodes(node.id, edges, nodes, 'model');
      const rules = node.data.rules || [];
      let content = `// Service for ${name}\n`;
      connectedModels.forEach(m => {
        content += `const ${m.data.label} = require('../models/${m.data.label.toLowerCase()}.model');\n`;
      });
      content += `\nclass ${name}Service {\n`;
      connectedModels.forEach(m => {
        content += `  async getAll${m.data.label}s() { return await ${m.data.label}.find(); }\n`;
      });
      rules.forEach((rule: any) => {
        content += `  // Rule: ${rule.name}\n  async ${rule.name.replace(/\s+/g, '')}() {\n    // ${rule.description}\n  }\n`;
      });
      content += `}\n\nmodule.exports = new ${name}Service();`;
      servicesFolder?.file(`${fileName}.service.js`, content);
    }

    if (node.type === 'controller') {
      const connectedServices = getConnectedNodes(node.id, edges, nodes, 'service');
      const rules = node.data.rules || [];
      let content = `// Controller for ${name}\n`;
      connectedServices.forEach(s => {
        content += `const ${s.data.label}Service = require('../services/${s.data.label.toLowerCase()}.service');\n`;
      });
      content += `\nconst ${name}Controller = {\n`;
      connectedServices.forEach(s => {
        const models = getConnectedNodes(s.id, edges, nodes, 'model');
        models.forEach(m => {
          content += `  async get${m.data.label}s(req, res) {\n    const data = await ${s.data.label}Service.getAll${m.data.label}s();\n    res.json(data);\n  },\n`;
        });
      });
      rules.forEach((rule: any) => {
        content += `  // Rule: ${rule.name}\n  async ${rule.name.replace(/\s+/g, '')}(req, res) {\n    // ${rule.description}\n    res.json({ message: "Rule ${rule.name} executed" });\n  },\n`;
      });
      content += `};\n\nmodule.exports = ${name}Controller;`;
      controllersFolder?.file(`${fileName}.controller.js`, content);
    }

    if (node.type === 'route') {
      const endpoints = node.data.endpoints || [];
      const connectedControllers = getConnectedNodes(node.id, edges, nodes, 'controller');
      let content = `const express = require('express');\nconst router = express.Router();\n`;
      connectedControllers.forEach(c => {
        content += `const ${c.data.label}Controller = require('../controllers/${c.data.label.toLowerCase()}.controller');\n`;
      });
      content += `\n`;
      endpoints.forEach((ep: any) => {
        content += `router.${ep.method.toLowerCase()}('${ep.path}', (req, res) => {\n  // Endpoint: ${ep.name}\n  res.json({ message: "${ep.name} endpoint" });\n});\n`;
      });
      content += `\nmodule.exports = router;`;
      routesFolder?.file(`${fileName}.routes.js`, content);
    }
  });

  folder.file("Dockerfile", `FROM node:18-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install\nCOPY . .\nEXPOSE 3000\nCMD ["npm", "start"]`);
  folder.file("README.md", "# Arachnet Generated API\n\nBuilt with Arachnet.");
}

// Python project generator (FastAPI)
function generatePythonProject(folder: JSZip, graph: any) {
  const { nodes, edges } = graph;
  const openApiSpec = generateOpenApiSpec(graph);
  folder.file("openapi.json", JSON.stringify(openApiSpec, null, 2));
  
  folder.file("requirements.txt", "fastapi\nuvicorn\nsqlalchemy\npydantic\npython-dotenv");
  folder.file("main.py", `from fastapi import FastAPI\nfrom dotenv import load_dotenv\nimport os\n\nload_dotenv()\napp = FastAPI(title="Arachnet API")\n\n@app.get("/")\nasync def root():\n    return {"message": "Arachnet API Running"}`);
  
  const modelsFolder = folder.folder("models");
  const schemasFolder = folder.folder("schemas");

  nodes.filter((n: any) => n.type === 'model').forEach((node: any) => {
    const name = node.data.label;
    const fileName = name.toLowerCase();
    const fields = node.data.fields || [];

    // Pydantic Schema
    let schemaContent = `from pydantic import BaseModel\nfrom typing import Optional\n\nclass ${name}Base(BaseModel):\n`;
    if (fields.length === 0) {
      schemaContent += `    pass\n`;
    } else {
      fields.forEach((f: any) => {
        const pyType = f.type === 'String' ? 'str' : f.type === 'Number' ? 'float' : 'any';
        schemaContent += `    ${f.name}: ${f.required ? pyType : `Optional[${pyType}]`}\n`;
      });
    }
    schemaContent += `\nclass ${name}Create(${name}Base):\n    pass\n\nclass ${name}(${name}Base):\n    id: int\n\n    class Config:\n        orm_mode = True`;
    schemasFolder?.file(`${fileName}.py`, schemaContent);

    // SQLAlchemy Model
    let modelContent = `from sqlalchemy import Column, Integer, String, Float, Boolean\nfrom database import Base\n\nclass ${name}DB(Base):\n    __tablename__ = "${fileName}s"\n\n    id = Column(Integer, primary_key=True, index=True)\n`;
    fields.forEach((f: any) => {
      const saType = f.type === 'String' ? 'String' : f.type === 'Number' ? 'Float' : 'String';
      modelContent += `    ${f.name} = Column(${saType})\n`;
    });
    modelsFolder?.file(`${fileName}.py`, modelContent);
  });

  folder.file("database.py", `from sqlalchemy import create_engine\nfrom sqlalchemy.ext.declarative import declarative_base\nfrom sqlalchemy.orm import sessionmaker\n\nSQLALCHEMY_DATABASE_URL = "sqlite:///./Arachnet.db"\nengine = create_engine(SQLALCHEMY_DATABASE_URL)\nSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)\nBase = declarative_base()`);
}

// Go project generator (Gin)
function generateGoProject(folder: JSZip, graph: any) {
  const { nodes } = graph;
  const openApiSpec = generateOpenApiSpec(graph);
  folder.file("openapi.json", JSON.stringify(openApiSpec, null, 2));
  
  folder.file("go.mod", `module arachnet-api\n\ngo 1.21\n\nrequire github.com/gin-gonic/gin v1.9.1`);
  folder.file("main.go", `package main\n\nimport "github.com/gin-gonic/gin"\n\nfunc main() {\n\tr := gin.Default()\n\tr.GET("/", func(c *gin.Context) {\n\t\tc.JSON(200, gin.H{"message": "Arachnet API Running"})\n\t})\n\tr.Run(":3000")\n}`);
  
  const modelsFolder = folder.folder("models");
  nodes.filter((n: any) => n.type === 'model').forEach((node: any) => {
    const name = node.data.label;
    const fields = node.data.fields || [];
    let content = `package models\n\ntype ${name} struct {\n\tID uint \`json:"id"\`\n`;
    fields.forEach((f: any) => {
      const goType = f.type === 'String' ? 'string' : f.type === 'Number' ? 'float64' : 'interface{}';
      content += `\t${f.name.charAt(0).toUpperCase() + f.name.slice(1)} ${goType} \`json:"${f.name}"\`\n`;
    });
    content += `}`;
    modelsFolder?.file(`${name.toLowerCase()}.go`, content);
  });
}

// Java project generator (Spring Boot)
function generateJavaProject(folder: JSZip, graph: any) {
  const { nodes } = graph;
  const basePkg = "com.arachnet.api";
  const pkgPath = "src/main/java/com/arachnet/api";
  
  const openApiSpec = generateOpenApiSpec(graph);
  folder.file("openapi.json", JSON.stringify(openApiSpec, null, 2));
  
  folder.file("pom.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<project xmlns="http://maven.apache.org/POM/4.0.0">...</project>`);
  folder.file(`${pkgPath}/ApiApplication.java`, `package ${basePkg};\n\nimport org.springframework.boot.SpringApplication;\nimport org.springframework.boot.autoconfigure.SpringBootApplication;\n\n@SpringBootApplication\npublic class ApiApplication {\n\tpublic static void main(String[] args) {\n\t\tSpringApplication.run(ApiApplication.class, args);\n\t}\n}`);

  const modelPkg = folder.folder(`${pkgPath}/models`);
  nodes.filter((n: any) => n.type === 'model').forEach((node: any) => {
    const name = node.data.label;
    const fields = node.data.fields || [];
    let content = `package ${basePkg}.models;\n\nimport jakarta.persistence.*;\nimport lombok.Data;\n\n@Entity\n@Data\npublic class ${name} {\n\t@Id\n\t@GeneratedValue(strategy = GenerationType.IDENTITY)\n\tprivate Long id;\n`;
    fields.forEach((f: any) => {
      const javaType = f.type === 'String' ? 'String' : f.type === 'Number' ? 'Double' : 'Object';
      content += `\tprivate ${javaType} ${f.name};\n`;
    });
    content += `}`;
    modelPkg?.file(`${name}.java`, content);
  });
}

// C# project generator (.NET Entity Framework)
function generateCSharpProject(folder: JSZip, graph: any) {
  const { nodes } = graph;
  const projectName = "ArachnetApi";
  
  const openApiSpec = generateOpenApiSpec(graph);
  folder.file("openapi.json", JSON.stringify(openApiSpec, null, 2));
  
  folder.file(`${projectName}.csproj`, `<Project Sdk="Microsoft.NET.Sdk.Web">\n  <PropertyGroup>\n    <TargetFramework>net8.0</TargetFramework>\n    <Nullable>enable</Nullable>\n    <ImplicitUsings>enable</ImplicitUsings>\n  </PropertyGroup>\n  <ItemGroup>\n    <PackageReference Include="Microsoft.EntityFrameworkCore" Version="8.0.0" />\n    <PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="8.0.0" />\n    <PackageReference Include="Microsoft.EntityFrameworkCore.Tools" Version="8.0.0" />\n    <PackageReference Include="Swashbuckle.AspNetCore" Version="6.5.0" />\n  </ItemGroup>\n</project>`);
  
  folder.file("Program.cs", `var builder = WebApplication.CreateBuilder(args);\nbuilder.Services.AddControllers();\nbuilder.Services.AddEndpointsApiExplorer();\nbuilder.Services.AddSwaggerGen();\n\nvar app = builder.Build();\nif (app.Environment.IsDevelopment()) {\n    app.UseSwagger();\n    app.UseSwaggerUI();\n}\napp.UseAuthorization();\napp.MapControllers();\napp.Run();`);

  const modelsFolder = folder.folder("Models");
  const controllersFolder = folder.folder("Controllers");

  nodes.forEach((node: any) => {
    const name = node.data.label;
    if (node.type === 'model') {
      const fields = node.data.fields || [];
      let content = `namespace ${projectName}.Models;\n\npublic class ${name}\n{\n    public int Id { get; set; }\n`;
      fields.forEach((f: any) => {
        const csType = f.type === 'String' ? 'string' : f.type === 'Number' ? 'double' : 'object';
        content += `    public ${csType} ${f.name} { get; set; } = default!;\n`;
      });
      content += `}`;
      modelsFolder?.file(`${name}.cs`, content);
    }

    if (node.type === 'controller') {
      const rules = node.data.rules || [];
      let content = `using Microsoft.AspNetCore.Mvc;\nusing ${projectName}.Models;\n\nnamespace ${projectName}.Controllers;\n\n[ApiController]\n[Route("[controller]")]\npublic class ${name}Controller : ControllerBase\n{\n`;
      rules.forEach((rule: any) => {
        content += `    [HttpGet("${rule.name.replace(/\s+/g, '')}")]\n    public IActionResult ${rule.name.replace(/\s+/g, '')}()\n    {\n        // ${rule.description}\n        return Ok(new { message = "Rule ${rule.name} executed" });\n    }\n`;
      });
      content += `}`;
      controllersFolder?.file(`${name}Controller.cs`, content);
    }

    if (node.type === 'route') {
      const endpoints = node.data.endpoints || [];
      let content = `using Microsoft.AspNetCore.Mvc;\n\nnamespace ${projectName}.Controllers;\n\n[ApiController]\n[Route("${name.toLowerCase()}")]\npublic class ${name}Controller : ControllerBase\n{\n`;
      endpoints.forEach((ep: any) => {
        const methodAttr = ep.method === 'GET' ? 'HttpGet' : ep.method === 'POST' ? 'HttpPost' : ep.method === 'PUT' ? 'HttpPut' : 'HttpDelete';
        content += `    [${methodAttr}("${ep.path.replace(/^\//, '')}")]\n    public IActionResult ${ep.name}()\n    {\n        return Ok(new { message = "${ep.name} endpoint" });\n    }\n`;
      });
      content += `}`;
      controllersFolder?.file(`${name}RoutesController.cs`, content);
    }
  });
}

startServer();


