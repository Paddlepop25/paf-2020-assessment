import {Injectable} from "@angular/core";
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Login } from "./models";

// import {CameraImage} from './models';

@Injectable()
export class AuthenticationService {

  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
  };
  
  constructor(private http: HttpClient) { }

  async authenticateLogin(login: Login): Promise<any> {
    console.log(login)
    return await this.http.post('http://localhost:3000', login, this.httpOptions)
    .toPromise()
    .catch((error: HttpErrorResponse) => {
      console.log('HttpError ---> ', error)
    })
  }
}

