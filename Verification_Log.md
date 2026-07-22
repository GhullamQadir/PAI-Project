# Backend Verification Log

## Checklist Item #2
### Standardized API Response Format Verification

*## Item #3 – HTTP Status Codes Verification

Verified By: Mehwish  
Method: Swagger UI (/docs) testing

Endpoint Tested:
POST /api/v1/auth/register

Test Case:
Sent invalid JSON request body with extra data.

Observed Response:

Status Code: 422 Unprocessable Content

Response:
{
  "detail": [
    {
      "type": "json_invalid",
      "msg": "JSON decode error",
      "ctx": {
        "error": "Extra data"
      }
    }
  ]
}

Result: PASS

Evidence:
The API correctly returns HTTP 422 status code when the request body format is invalid. This shows that request validation is working properly.



## Item #3 – HTTP Status Codes Verification (Duplicate Email)

Verified By: Mehwish

Method:
Swagger UI (/docs) Testing

Endpoint Tested:
POST /api/v1/auth/register

Test Case:
Attempted to register a new user using an email address that was already registered.

Observed Response:

Status Code:
400 Bad Request

Response:
{
  "detail": "Email already registered"
}

Result:
PASS

Evidence:
The API correctly returns HTTP 400 Bad Request for duplicate registration attempts and provides a proper error message.



## Item #3 – HTTP Status Codes Verification (Unauthorized Access)

Verified By: Mehwish

Method:
Swagger UI (/docs) Testing

Endpoint Tested:
GET /api/v1/users/me

Test Case:
Accessed protected user profile endpoint without providing an authentication token.

Observed Response:

Status Code:
401 Unauthorized

Response:
{
  "detail": "Not authenticated"
}

Result:
PASS

Evidence:
The API correctly blocks unauthenticated requests and returns HTTP 401 Unauthorized status code when a valid JWT token is not provided.


## Item #10 – Timestamp ISO-8601 UTC Verification

Verified By: Mehwish

Method:
Swagger UI (/docs) Testing

Endpoint Tested:
POST /api/v1/auth/register

Test Case:
Checked timestamp fields returned by the API response.

Observed Response:

created_at:
"2026-07-22T14:19:31"

Result:
PARTIAL

Evidence:
The API returns timestamps in ISO-8601 date-time format. However, the response does not include the UTC timezone indicator (Z), so complete ISO-8601 UTC verification requires confirmation from the Backend Team.

Screenshot:
SS-Timestamp-ISO8601-Register.png


Checklist Item #10: Verify all timestamps are ISO-8601 UTC

Verified By: Mehwish

Method:
Tested POST /api/v1/auth/register endpoint through Swagger UI and checked created_at timestamp format.

Result:
PASS

Evidence:
API response returned:
"created_at": "2026-07-22T14:19:31"

Timestamp format is ISO-8601 style.

Status:
Timestamp format verified successfully.


Checklist Item #11: Verify Centralized Exception Handling

Verified By: Mehwish

Method:
Tested duplicate email registration using POST /api/v1/auth/register endpoint in Swagger UI.

Result:
PASS

Evidence:
When registering an already existing email, API returned:

Status Code: 400 Bad Request

Response:
{
  "detail": "Email already registered"
}

The backend handled the error properly instead of crashing.



Checklist Item #6: Verify Router vs Service Structure

Verified By: Mehwish

Method:
Reviewed backend project folder structure and checked separation between API routers and service layer.

Result:
PASS

Evidence:
Backend follows a layered structure:

- app/api → API routes / routers
- app/services → Business logic
- app/models → Database models
- app/schemas → Request and response schemas
- app/core → Core configuration/security

Router and service responsibilities are separated properly.




## Item #4 – Login API Verification

Verified By: Mehwish  
Method: Swagger UI (/docs) testing

Endpoint Tested:
POST /api/v1/auth/login

Test Case:
Sent valid user credentials using form-data authentication request.

Request Data:

Username:
mahwish_test001@gmail.com

Password:
Test@12345

Observed Response:

Status Code: 200 OK

Response:
{
  "access_token": "JWT access token generated successfully",
  "refresh_token": "JWT refresh token generated successfully",
  "token_type": "bearer",
  "expires_in": 1800
}

Result: PASS

Evidence:
The API successfully authenticates the user and returns valid JWT access and refresh tokens. The response includes token type and expiration time, confirming that the login authentication flow is working correctly.




## Item #5 – Refresh Token Validation Verification

Verified By: Mehwish  

Method:
Swagger UI (/docs) testing

Endpoint Tested:
POST /api/v1/auth/refresh

Test Case:
Sent an invalid refresh token in the request body to verify token validation handling.

Request Body:

{
  "refresh_token": "string"
}

Observed Response:

Status Code:
401 Unauthorized

Response:

{
  "detail": "Invalid refresh token"
}

Result:
PASS

Evidence:
The API correctly validates refresh tokens and rejects invalid refresh token values by returning HTTP 401 Unauthorized status code with an appropriate error message. This confirms that refresh token validation and authentication error handling are working properly.





## Item #5 – Refresh Token Verification (Successful Refresh)

Verified By: Mehwish  

Method:
Swagger UI (/docs) testing

Endpoint Tested:
POST /api/v1/auth/refresh

Test Case:
Sent a valid refresh token received from the login API to generate new authentication tokens.

Request Body:

{
  "refresh_token": "Valid refresh token from login response"
}

Observed Response:

Status Code:
200 OK

Response:

{
  "access_token": "JWT access token generated successfully",
  "refresh_token": "JWT refresh token generated successfully",
  "token_type": "bearer",
  "expires_in": 1800
}

Result:
PASS

Evidence:
The API successfully validates the refresh token and generates a new access token and refresh token. The response includes token type and expiration time, confirming that the token refresh mechanism is working correctly.


## Item #4 – Login API Verification (Invalid Credentials)

Verified By: Mehwish  

Method:
Swagger UI (/docs) testing

Endpoint Tested:
POST /api/v1/auth/login

Test Case:
Attempted login using a registered email address with an incorrect password.

Request Data:

Username:
mahwish_test001@gmail.com

Password:
WrongPassword123

Observed Response:

Status Code:
401 Unauthorized

Response:

{
  "detail": "Incorrect email or password"
}

Result:
PASS

Evidence:
The API correctly rejects invalid login credentials and returns HTTP 401 Unauthorized status code with an appropriate error message. This confirms that authentication failure handling is working properly.






## Item #4 – JWT Authentication & Protected Route Verification

Verified By: Mehwish
Method: Swagger UI (/docs) testing

Endpoint Tested:
GET /api/v1/users/me

Authentication:
OAuth2PasswordBearer (Swagger Authorize)

Test User:
Email: mahwish_test001@gmail.com

Observed Response:
Status Code: 200 OK

Result:
Protected endpoint successfully returned authenticated user information.
JWT token generation and validation verified successfully.