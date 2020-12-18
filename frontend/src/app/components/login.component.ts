import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthenticationService } from '../authentication.service';
import { Login } from '../models';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  form: FormGroup

	errorMessage = ''

	constructor(private fb: FormBuilder, private authenticateSvc: AuthenticationService, private router: Router) { }

	ngOnInit(): void {

    this.form = this.fb.group({
      username: this.fb.control('', [ Validators.required ]),
      password: this.fb.control('', [ Validators.required ]),
    })
   }

   onLogin() {
     console.log(this.form.value)
     let username = this.form.get('username').value
     let password = this.form.get('password').value

     this.authenticateSvc.authenticateLogin({username, password} as Login)
     .then(result => {
       console.log(result) // 
       this.router.navigate(['/main'])
     })
     .catch(error => {
        console.error('Cannot login >>> ', error)
        this.errorMessage = error.message
     })
   }
}
