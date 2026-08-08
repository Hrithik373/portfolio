FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /svc
RUN addgroup -S vik && adduser -S vik -G vik
COPY --from=build /build/target/*.jar app.jar
USER vik
EXPOSE 8016
ENTRYPOINT ["java", "-jar", "app.jar"]
