export namespace models {
	
	export class JSONDateTime {
	
	
	    static createFrom(source: any = {}) {
	        return new JSONDateTime(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	
	    }
	}
	export class Repository {
	    id: number;
	    name: string;
	    full_name: string;
	    owner: string;
	    description: string;
	    language: string;
	    stargazers_count: number;
	    stars_today: number;
	    stars_since: number;
	    forks_count: number;
	    html_url: string;
	    created_at: JSONDateTime;
	    updated_at: JSONDateTime;
	
	    static createFrom(source: any = {}) {
	        return new Repository(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.full_name = source["full_name"];
	        this.owner = source["owner"];
	        this.description = source["description"];
	        this.language = source["language"];
	        this.stargazers_count = source["stargazers_count"];
	        this.stars_today = source["stars_today"];
	        this.stars_since = source["stars_since"];
	        this.forks_count = source["forks_count"];
	        this.html_url = source["html_url"];
	        this.created_at = this.convertValues(source["created_at"], JSONDateTime);
	        this.updated_at = this.convertValues(source["updated_at"], JSONDateTime);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

