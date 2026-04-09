export namespace main {
	
	export class BuildStep {
	    name: string;
	    desc: string;
	    kind: string;
	
	    static createFrom(source: any = {}) {
	        return new BuildStep(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.desc = source["desc"];
	        this.kind = source["kind"];
	    }
	}
	export class Diag {
	    file: string;
	    line: number;
	    col: number;
	    kind: string;
	    message: string;
	    source: string;
	
	    static createFrom(source: any = {}) {
	        return new Diag(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.file = source["file"];
	        this.line = source["line"];
	        this.col = source["col"];
	        this.kind = source["kind"];
	        this.message = source["message"];
	        this.source = source["source"];
	    }
	}
	export class FileNode {
	    name: string;
	    path: string;
	    isDir: boolean;
	    ext: string;
	    children?: FileNode[];
	
	    static createFrom(source: any = {}) {
	        return new FileNode(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.path = source["path"];
	        this.isDir = source["isDir"];
	        this.ext = source["ext"];
	        this.children = this.convertValues(source["children"], FileNode);
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
	export class GitStatus {
	    modified: string[];
	    added: string[];
	    untracked: string[];
	    deleted: string[];
	    branch: string;
	    hasGit: boolean;
	
	    static createFrom(source: any = {}) {
	        return new GitStatus(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.modified = source["modified"];
	        this.added = source["added"];
	        this.untracked = source["untracked"];
	        this.deleted = source["deleted"];
	        this.branch = source["branch"];
	        this.hasGit = source["hasGit"];
	    }
	}

}

