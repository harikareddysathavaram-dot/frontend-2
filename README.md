# Stagwell Workers' Compensation UI (Angular)

Setup (Angular 17, 18 or 19):

    npx @angular/cli@18 new workers-comp-ui --routing --style=css --ssr=false --skip-git
    cd workers-comp-ui
    rm -rf src/app
    # copy this zip's src/ folder over the project's src/ folder (replace everything)
    ng serve

Open http://localhost:4200

Connecting your backend:
1. src/environments/environment.ts -> set useMock:false and apiUrl to your Ocelot gateway.
2. Check the URLs inside core/*.service.ts (each has a comment showing which microservice it targets).
3. Make the JSON shapes match core/models.ts, or adjust the models.
