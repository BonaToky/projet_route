FROM eclipse-temurin:17-jdk

WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -Dmaven.repo.local=/app/.m2
COPY src ./src
RUN mvn clean compile -Dmaven.repo.local=/app/.m2
RUN mvn package -DskipTests -Dmaven.repo.local=/app/.m2

COPY app /app

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]

# FROM maven:3.9-eclipse-temurin-17 AS build
# WORKDIR /app
# COPY pom.xml .
# COPY src ./src
# RUN mvn clean package -DskipTests

# FROM eclipse-temurin:17-jdk
# WORKDIR /app
# COPY --from=build /app/target/*.jar app.jar
# EXPOSE 8080
# CMD ["java", "-jar", "app.jar"]