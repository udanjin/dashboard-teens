"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@overnightjs/core");
const body_parser_1 = __importDefault(require("body-parser"));
// import sportReportRouter from './routes/SportReportRouter';
// import totalCostRouter from './routes/TotalCostRouter';
// import uangKasRouter from './routes/UangKasRouter';
const db_1 = __importDefault(require("./config/db"));
class AppServer extends core_1.Server {
    constructor() {
        super();
        this.app.use(body_parser_1.default.json());
        this.app.use(body_parser_1.default.urlencoded({ extended: true }));
        this.setupRoutes();
        this.setupDatabase();
    }
    setupRoutes() {
        // this.app.use('/api/sport-reports', sportReportRouter);
        // this.app.use('/api/total-costs', totalCostRouter);
        // this.app.use('/api/uang-kas', uangKasRouter);
        this.app.get('*', (req, res) => {
            res.status(404).json({ message: 'Route not found' });
        });
    }
    setupDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield db_1.default.authenticate();
                yield db_1.default.sync();
                console.log('Database connected and synced');
            }
            catch (error) {
                console.error('Database connection error:', error);
            }
        });
    }
    start(port) {
        this.app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    }
}
const server = new AppServer();
server.start(3000);
