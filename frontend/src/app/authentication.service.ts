import {Injectable} from "@angular/core";
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Login } from "./models";

// import {CameraImage} from './models';

@Injectable()
export class AuthenticationService {

  username = ''
  password = ''

  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
  };
  
  constructor(private http: HttpClient) { }

  async authenticateLogin(login: Login): Promise<any> {
    console.log(login)
    // console.log(login['username'])
    this.username = login['username'] // can log
    this.password = login['password']

    return await this.http.post('http://localhost:3000', login, this.httpOptions)
    .toPromise()
    .catch((error: HttpErrorResponse) => {
      console.log('HttpError ---> ', error)
    })
  }

  getUserNameAndPassword() {
    return [this.username, this.password]
  }
}

// result >>>  TextRow {
//   user_id: 'fred',
//   password: '31017a722665e4afce586950f42944a6d331dabf'
// }