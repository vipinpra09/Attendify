# Attendify Backend

Spring Boot 3 REST API for the Attendify college attendance system.

## Stack

- Java 17
- Spring Boot 3.2
- Spring Security + JWT (jjwt)
- Spring Data JPA / Hibernate
- PostgreSQL
- Maven

## Database

```bash
# Start PostgreSQL, then create the database and user
sudo service postgresql start

sudo -u postgres psql -c "CREATE USER attendify WITH PASSWORD 'attendify' LOGIN;"
sudo -u postgres psql -c "CREATE DATABASE attendify OWNER attendify;"
sudo -u postgres psql -d attendify -c "GRANT ALL ON SCHEMA public TO attendify;"
```

Default connection in `src/main/resources/application.properties`:

```
jdbc:postgresql://localhost:5432/attendify
username: attendify
password: attendify
```

Override with `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, and `SPRING_DATASOURCE_PASSWORD`.

## Run

```bash
cd backend
mvn spring-boot:run
```

The API listens on `http://localhost:8080`.

On first startup the seeder creates demo users, classes, subjects, and attendance history.

## Demo credentials

| Role    | Email                   | Password    |
|---------|-------------------------|-------------|
| Admin   | admin@attendify.com     | admin123    |
| Teacher | teacher@attendify.com   | teacher123  |
| Student | student@attendify.com   | student123  |

## Auth

Send the JWT from login on every authenticated request:

```
Authorization: Bearer <token>
```
