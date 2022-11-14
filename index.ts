import express, { NextFunction, Request, Response } from "express";
import session from "express-session";
import path from "path";

class User {
    public name: string;

    public password: string;

    public constructor(name: string, password: string) {
        this.name = name;
        this.password = password;
    }
}

declare module 'express-session' {
    interface SessionData {
        user: User;
        error: string;
        success: string;
    }
}

const users: User[] = [
    { name: 'tj', password: 'foobar' },
];

function findUser(name: string): User | null {
    var user = users.find(user => user.name === name);
    if (!user) return null;
    else return user;
}


function authenticate(name: string, pass: string, fn: (user: User | null) => void) {
    var user = findUser(name);
    if (!user) return fn(null);
    if (pass === user.password) return fn(user);
    fn(null);
}

function index(req: Request, res: Response, next: NextFunction): void {
    try {
        res.redirect('/login');
    } catch (error) {
        next(error);
    }
};

function signUp(req: Request, res: Response, next: NextFunction): void {
    try {
        res.render('login', { loggedin: req.session.user });
    } catch (error) {
        next(error);
    }
};

function logIn(req: Request, res: Response, next: NextFunction): void {
    try {
        authenticate(req.body.username, req.body.password, function (user) {
            if (user) {
                req.session.regenerate(function () {
                    req.session.user = user;
                    req.session.success = 'username: ' + user.name;
                    res.redirect('back');
                });
            } else {
                req.session.error = '비밀번호가 틀렸습니다. '
                    + ' (use "tj" and "foobar")';
                res.redirect('/');
            }
        });
    } catch (error) {
        next(error);
    }
};

function logOut(req: Request, res: Response, next: NextFunction): void {
    try {
        req.session.destroy(function () {
            res.redirect('/');
        });
    } catch (error) {
        next(error);
    }
};
function restricted(req: Request, res: Response, next: NextFunction): void {
    try {
        if (req.session.user) {
            res.render("restricted");
        } else {
            req.session.error = '접근 금지!';
            res.redirect('/');
        }

    } catch (error) {
        next(error);
    }
};


class App {
    public app: express.Application;
    constructor() {
        this.app = express();
        this.initializeMiddlewares();
        this.initializeRoutes();
    }

    public listen(port: number) {
        this.app.listen(port);
    }
    private initializeMiddlewares() {
        this.app.set('view engine', 'ejs');
        this.app.set('views', path.join(__dirname, 'views'));

        this.app.use(express.urlencoded({ extended: false }));
        this.app.use(session({
            resave: false,
            saveUninitialized: false,
            secret: 'asdf!@#$qwer'
        }));
        this.app.use(function (req: Request, res: Response, next) {
            var err = req.session.error;
            var msg = req.session.success;
            delete req.session.error;
            delete req.session.success;
            res.locals.message = '';
            if (err) res.locals.message = '<p class="msg error">' + err + '</p>';
            if (msg) res.locals.message = '<p class="msg success">' + msg + '</p>';
            next();
        });
    }

    private initializeRoutes() {
        this.app.get('/', index);
        this.app.get('/login', signUp);
        this.app.post('/login', logIn);
        this.app.get('/restricted', restricted);
        this.app.get('/logout', logOut);
    }
}

const app = new App();

app.listen(8080)
