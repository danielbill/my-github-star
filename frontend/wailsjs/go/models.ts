export namespace backend {
	
	export class DeviceFlowInfo {
	    user_code: string;
	    verification_uri: string;
	    verification_uri_complete: string;
	    expires_in: number;
	    interval: number;
	
	    static createFrom(source: any = {}) {
	        return new DeviceFlowInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.user_code = source["user_code"];
	        this.verification_uri = source["verification_uri"];
	        this.verification_uri_complete = source["verification_uri_complete"];
	        this.expires_in = source["expires_in"];
	        this.interval = source["interval"];
	    }
	}
	export class TrendingData {
	    repositories: models.Repository[];
	    cached_at: string;
	
	    static createFrom(source: any = {}) {
	        return new TrendingData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.repositories = this.convertValues(source["repositories"], models.Repository);
	        this.cached_at = source["cached_at"];
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
	export class LoadTrendingDataResponse {
	    weekly: TrendingData;
	    monthly: TrendingData;
	
	    static createFrom(source: any = {}) {
	        return new LoadTrendingDataResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.weekly = this.convertValues(source["weekly"], TrendingData);
	        this.monthly = this.convertValues(source["monthly"], TrendingData);
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
	export class RefreshTrendingResponse {
	    success: boolean;
	    message: string;
	    weekly: TrendingData;
	    monthly: TrendingData;
	
	    static createFrom(source: any = {}) {
	        return new RefreshTrendingResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.message = source["message"];
	        this.weekly = this.convertValues(source["weekly"], TrendingData);
	        this.monthly = this.convertValues(source["monthly"], TrendingData);
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
	export class Settings {
	    refresh_interval: number;
	    github_clone_dir: string;
	
	    static createFrom(source: any = {}) {
	        return new Settings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.refresh_interval = source["refresh_interval"];
	        this.github_clone_dir = source["github_clone_dir"];
	    }
	}

}

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
	export class User {
	    id: number;
	    login: string;
	    name: string;
	    email: string;
	    avatar_url: string;
	    bio: string;
	    location: string;
	    blog: string;
	    company: string;
	    public_repos: number;
	    followers: number;
	    following: number;
	    created_at: JSONDateTime;
	    updated_at: JSONDateTime;
	
	    static createFrom(source: any = {}) {
	        return new User(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.login = source["login"];
	        this.name = source["name"];
	        this.email = source["email"];
	        this.avatar_url = source["avatar_url"];
	        this.bio = source["bio"];
	        this.location = source["location"];
	        this.blog = source["blog"];
	        this.company = source["company"];
	        this.public_repos = source["public_repos"];
	        this.followers = source["followers"];
	        this.following = source["following"];
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

